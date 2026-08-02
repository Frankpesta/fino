import { v } from "convex/values";
import { mutation, query, internalQuery } from "./_generated/server";
import { internal } from "./_generated/api";
import { requireVerifiedUser } from "./model/authz";
import { notificationPreferencesValidator } from "./schema";
import { generateTotpSecret, generateTotpUri, verifyTotp } from "../lib/totp";
import { encryptTotpSecret, decryptTotpSecret } from "./model/secrets";

export const updateName = mutation({
  args: { name: v.string() },
  handler: async (ctx, args) => {
    const user = await requireVerifiedUser(ctx);
    const trimmed = args.name.trim();
    if (trimmed.length === 0) throw new Error("Name cannot be empty");
    if (trimmed.length > 100) throw new Error("Name is too long");
    await ctx.db.patch(user._id, { name: trimmed });
  },
});

export const updateNotificationPreferences = mutation({
  args: { preferences: notificationPreferencesValidator },
  handler: async (ctx, args) => {
    const user = await requireVerifiedUser(ctx);
    await ctx.db.patch(user._id, { notificationPreferences: args.preferences });
  },
});

// Soft flag only -- an admin reviews and handles actual account closure.
// Financial records are never deleted (see docs/06-phase-5-referrals-
// profile.md 5.2 "don't hard-delete financial records").
export const requestAccountDeletion = mutation({
  args: {},
  handler: async (ctx) => {
    const user = await requireVerifiedUser(ctx);
    await ctx.db.patch(user._id, { deletionRequestedAt: Date.now() });
  },
});

export const cancelAccountDeletionRequest = mutation({
  args: {},
  handler: async (ctx) => {
    const user = await requireVerifiedUser(ctx);
    await ctx.db.patch(user._id, { deletionRequestedAt: undefined });
  },
});

// --- 2FA (TOTP) ---
//
// Plain mutations, not "use node" actions -- lib/totp.ts runs entirely on
// Web Crypto (crypto.subtle), which Convex's default V8-isolate runtime
// supports directly. No need for the Node runtime here.

const TOTP_ISSUER = "Zypherex";

// Generates a new secret but does NOT enable 2FA yet -- that only happens
// once the user proves they've actually added it to an authenticator app by
// submitting a valid code via `confirm2FASetup`. Overwrites any previous
// unconfirmed secret if setup is restarted.
//
// The secret is encrypted (AES-GCM, see lib/secretBox.ts) before it's
// stored -- only this one response ever carries the plaintext, for the QR
// code / manual-entry display. Every later read decrypts it server-side.
export const begin2FASetup = mutation({
  args: {},
  handler: async (ctx) => {
    const user = await requireVerifiedUser(ctx);
    const secret = generateTotpSecret();
    const encrypted = await encryptTotpSecret(secret);
    await ctx.db.patch(user._id, { twoFactorSecret: encrypted, twoFactorEnabled: false });
    return {
      secret,
      uri: generateTotpUri({ secretBase32: secret, accountName: user.email, issuer: TOTP_ISSUER }),
    };
  },
});

export const confirm2FASetup = mutation({
  args: { code: v.string() },
  handler: async (ctx, args) => {
    const user = await requireVerifiedUser(ctx);
    if (!user.twoFactorSecret) {
      throw new Error("No 2FA setup in progress -- call begin2FASetup first");
    }
    const secret = await decryptTotpSecret(user.twoFactorSecret);
    const valid = await verifyTotp(secret, args.code);
    if (!valid) throw new Error("Invalid code");

    await ctx.db.patch(user._id, { twoFactorEnabled: true });
    await ctx.scheduler.runAfter(0, internal.emails.sendSecurityNotice, {
      userId: user._id,
      message: "Two-factor authentication was just enabled on your account.",
    });
  },
});

export const disable2FA = mutation({
  args: { code: v.string() },
  handler: async (ctx, args) => {
    const user = await requireVerifiedUser(ctx);
    if (!user.twoFactorEnabled || !user.twoFactorSecret) {
      throw new Error("2FA is not enabled");
    }
    const secret = await decryptTotpSecret(user.twoFactorSecret);
    const valid = await verifyTotp(secret, args.code);
    if (!valid) throw new Error("Invalid code");

    await ctx.db.patch(user._id, { twoFactorEnabled: false, twoFactorSecret: undefined });
    await ctx.scheduler.runAfter(0, internal.emails.sendSecurityNotice, {
      userId: user._id,
      message: "Two-factor authentication was just disabled on your account.",
    });
  },
});

// Internal-only: no auth check of their own, since the "use node" actions in
// convex/profileActions.ts that call these already derive `userId` from the
// caller's own session (getAuthUserId), never from client input. Must stay
// `internalQuery`, not `query` -- a public version would let anyone read any
// user's full row (balances included) by guessing a userId.
export const getUserInternal = internalQuery({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.userId);
  },
});

export const listSessionIdsInternal = internalQuery({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const sessions = await ctx.db
      .query("authSessions")
      .withIndex("userId", (q) => q.eq("userId", args.userId))
      .collect();
    return sessions.map((s) => s._id);
  },
});

export const listSessions = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireVerifiedUser(ctx);
    const sessions = await ctx.db
      .query("authSessions")
      .withIndex("userId", (q) => q.eq("userId", user._id))
      .collect();
    return sessions.map((s) => ({ _id: s._id, expirationTime: s.expirationTime }));
  },
});
