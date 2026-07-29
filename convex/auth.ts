import { Password } from "@convex-dev/auth/providers/Password";
import { convexAuth } from "@convex-dev/auth/server";
import { internal } from "./_generated/api";
import type { MutationCtx } from "./_generated/server";
import { generateReferralCode } from "../lib/referralCode";
import { generateVerificationCode, VERIFICATION_CODE_TTL_MS } from "../lib/verificationCode";

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [Password],
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

      const userId = await ctx.db.insert("users", {
        email,
        emailVerified: false,
        role: "user",
        status: "active",
        referralCode,
        balances: { BTC: 0, ETH: 0, USDT: 0, USDC: 0, BNB: 0 },
        twoFactorEnabled: false,
        createdAt: now,
        lastLoginAt: now,
      });

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
