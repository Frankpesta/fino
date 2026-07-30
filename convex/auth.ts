import { ConvexCredentials } from "@convex-dev/auth/providers/ConvexCredentials";
import { convexAuth, createAccount, retrieveAccount } from "@convex-dev/auth/server";
import { Scrypt } from "lucia";
import { internal } from "./_generated/api";
import type { MutationCtx } from "./_generated/server";
import type { Doc } from "./_generated/dataModel";
import { generateReferralCode } from "../lib/referralCode";
import { generateVerificationCode, VERIFICATION_CODE_TTL_MS } from "../lib/verificationCode";
import { verifyTotp } from "../lib/totp";
import { getReferralCommissionRateDefault } from "./model/settings";
import { decryptTotpSecret } from "./model/secrets";

const MIN_PASSWORD_LENGTH = 8;

// A custom credentials provider instead of the stock `Password` provider --
// needed to insert a 2FA challenge into the signIn flow, which Password's
// config surface has no extension point for. Reuses the exact same
// createAccount/retrieveAccount primitives Password itself is built on
// (confirmed via its source), just with an "id: password" so it operates on
// the same authAccounts rows -- convex/profileActions.ts's changePassword
// (which calls retrieveAccount/modifyAccountCredentials directly) keeps
// working unchanged.
//
// Two-step 2FA: the client always sends { email, password, flow }. If the
// account has 2FA enabled and no `code` was included, this throws the
// sentinel "2FA_REQUIRED" instead of completing sign-in; the client catches
// that specific message and re-submits with `code` added. See
// app/(auth)/sign-in/page.tsx.
const credentialsProvider = ConvexCredentials({
  id: "password",
  authorize: async (params, ctx) => {
    const flow = params.flow as string | undefined;
    const email = params.email as string | undefined;
    const password = params.password as string | undefined;

    if (!email) {
      throw new Error("Missing `email` param");
    }

    if (flow === "signUp") {
      if (!password) throw new Error("Missing `password` param for `signUp` flow");
      if (password.length < MIN_PASSWORD_LENGTH) {
        throw new Error("Invalid password");
      }

      const ref = typeof params.ref === "string" ? params.ref : undefined;
      const { user } = await createAccount(ctx, {
        provider: "password",
        account: { id: email, secret: password },
        profile: { email, ...(ref ? { ref } : {}) },
      });
      return { userId: user._id };
    }

    if (flow === "signIn") {
      if (!password) throw new Error("Missing `password` param for `signIn` flow");

      // retrieveAccount returns null if the account doesn't exist, but
      // *throws* if it exists and the secret is wrong ("InvalidSecret") or
      // this account has failed too many times recently
      // ("TooManyFailedAttempts", enforced by Convex Auth itself --
      // authRateLimits, 10/hour token bucket, no code of ours involved).
      let retrieved;
      try {
        retrieved = await retrieveAccount(ctx, {
          provider: "password",
          account: { id: email, secret: password },
        });
      } catch (err) {
        if (err instanceof Error && err.message === "TooManyFailedAttempts") {
          throw new Error("Too many failed attempts. Try again later.");
        }
        retrieved = null;
      }
      if (!retrieved) throw new Error("Invalid credentials");

      // retrieveAccount types `user` as a generic doc since the library
      // can't see our schema at its own compile time -- same reasoning as
      // the MutationCtx cast on createOrUpdateUser above. Same runtime
      // object as our generated Doc<"users">.
      const user = retrieved.user as unknown as Doc<"users">;
      if (user.twoFactorEnabled) {
        const code = typeof params.code === "string" ? params.code : undefined;
        if (!code) {
          throw new Error("2FA_REQUIRED");
        }

        // The password step above is rate-limited by Convex Auth itself,
        // but code-guessing here is our own logic and isn't covered by
        // that -- rate limit it separately (see convex/twoFactorRateLimit.ts).
        const { allowed } = await ctx.runMutation(
          internal.twoFactorRateLimit.checkAndConsumeAttemptInternal,
          { userId: user._id },
        );
        if (!allowed) {
          throw new Error("Too many failed attempts. Try again later.");
        }

        if (!user.twoFactorSecret) {
          // Enabled but no secret on file shouldn't happen (disable2FA
          // always clears both together) -- fail closed rather than skip
          // the check.
          throw new Error("Invalid code");
        }
        const secret = await decryptTotpSecret(user.twoFactorSecret);
        const valid = await verifyTotp(secret, code);
        if (!valid) throw new Error("Invalid code");

        await ctx.runMutation(internal.twoFactorRateLimit.resetAttemptsInternal, {
          userId: user._id,
        });
      }

      return { userId: user._id };
    }

    throw new Error('Missing `flow` param, it must be one of "signUp" or "signIn"');
  },
  // Same Scrypt-based hashing Password() uses by default (confirmed via its
  // source) -- ConvexCredentials has no built-in default, so dropping
  // Password() means supplying this ourselves or every account would fail
  // to hash/verify at all.
  crypto: {
    async hashSecret(password) {
      return await new Scrypt().hash(password);
    },
    async verifySecret(password, hash) {
      return await new Scrypt().verify(hash, password);
    },
  },
});

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [credentialsProvider],
  callbacks: {
    // Runs on every sign-in; only initialize our app-specific fields the
    // first time a users row is created for this identity. Convex Auth
    // itself owns the row's lifecycle (auth accounts/sessions) -- this hook
    // is where we attach the domain fields from docs/01-data-model.md.
    async createOrUpdateUser(genericCtx, args) {
      if (args.existingUserId) {
        return args.existingUserId;
      }

      // @convex-dev/auth types this callback's ctx as GenericMutationCtx<AnyDataModel>
      // since the library can't see our schema at its own compile time. It's the
      // same runtime object as our generated MutationCtx, so this cast is safe.
      const ctx = genericCtx as unknown as MutationCtx;

      const email = (args.profile.email as string | undefined) ?? "";
      const now = Date.now();

      // Referral codes are random 8-char strings; collisions are possible
      // but extremely unlikely (33^8 space). Retry a few times on collision
      // rather than failing signup outright.
      let referralCode = generateReferralCode();
      for (let attempt = 0; attempt < 5; attempt++) {
        const existing = await ctx.db
          .query("users")
          .withIndex("by_referralCode", (q) => q.eq("referralCode", referralCode))
          .unique();
        if (!existing) break;
        referralCode = generateReferralCode();
      }

      // Attribute the signup to a referrer if a valid `?ref=` code was
      // passed through. Commission itself only accrues on the referred
      // user's *deposit approval*, not here (see convex/deposits.ts
      // `approve` and docs/06-phase-5-referrals-profile.md 5.1) -- this just
      // records the relationship and locks in the rate at signup time.
      const refCode = (args.profile as { ref?: string }).ref;
      const referrer = refCode
        ? await ctx.db
            .query("users")
            .withIndex("by_referralCode", (q) => q.eq("referralCode", refCode))
            .unique()
        : null;

      const userId = await ctx.db.insert("users", {
        email,
        emailVerified: false,
        role: "user",
        status: "active",
        referredBy: referrer?._id,
        referralCode,
        balances: { BTC: 0, ETH: 0, USDT: 0, USDC: 0, BNB: 0 },
        twoFactorEnabled: false,
        createdAt: now,
        lastLoginAt: now,
      });

      if (referrer) {
        const commissionRate = await getReferralCommissionRateDefault(ctx);
        await ctx.db.insert("referrals", {
          referrerId: referrer._id,
          referredUserId: userId,
          commissionRate,
          totalCommissionEarned: { BTC: 0, ETH: 0, USDT: 0, USDC: 0, BNB: 0 },
          createdAt: now,
        });
      }

      // Kick off Phase 1.3's email verification flow: 6-digit code, 15-min
      // expiry. Sending is a scheduled action (mutations can't call out to
      // Resend) and stays a console.log stub until Phase 6 wires it up.
      const code = generateVerificationCode();
      await ctx.db.insert("emailVerifications", {
        userId,
        code,
        expiresAt: now + VERIFICATION_CODE_TTL_MS,
        lastSentAt: now,
      });
      await ctx.scheduler.runAfter(0, internal.emailVerification.sendVerificationEmail, {
        userId,
        code,
      });

      return userId;
    },
  },
});
