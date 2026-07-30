import { v } from "convex/values";
import { mutation, internalMutation } from "./_generated/server";
import { internal } from "./_generated/api";
import {
  generateVerificationCode,
  isExpired,
  canResend,
  VERIFICATION_CODE_TTL_MS,
} from "../lib/verificationCode";

// Always returns the same generic response regardless of whether the email
// exists, was just rate-limited, or a code was actually sent -- anything
// else would let an attacker enumerate registered emails by comparing
// responses. See docs/07-phase-6-emails-notifications.md 6.3 on rate-
// limiting resend-triggered emails; this reuses the exact same 1/min
// cooldown as email verification resends.
export const requestReset = mutation({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .unique();

    if (user) {
      const latest = await ctx.db
        .query("passwordResets")
        .withIndex("by_userId", (q) => q.eq("userId", user._id))
        .order("desc")
        .first();

      const now = Date.now();
      if (!latest || canResend(latest.lastSentAt, now)) {
        const code = generateVerificationCode();
        await ctx.db.insert("passwordResets", {
          userId: user._id,
          code,
          expiresAt: now + VERIFICATION_CODE_TTL_MS,
          lastSentAt: now,
        });
        await ctx.scheduler.runAfter(0, internal.emails.sendPasswordResetCode, {
          userId: user._id,
          code,
        });
      }
    }

    return { success: true as const };
  },
});

// Internal-only: deliberately throws a single generic message for every
// failure mode (no account, no code on file, expired, already used, wrong
// code) so a caller can't distinguish "no such account" from "wrong code"
// -- same enumeration-avoidance reasoning as requestReset.
export const validateAndConsumeResetCodeInternal = internalMutation({
  args: { email: v.string(), code: v.string() },
  handler: async (ctx, args) => {
    const genericError = "Invalid or expired code";
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .unique();
    if (!user) throw new Error(genericError);

    const record = await ctx.db
      .query("passwordResets")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .order("desc")
      .first();
    if (!record) throw new Error(genericError);
    if (record.consumedAt) throw new Error(genericError);
    if (isExpired(record.expiresAt, Date.now())) throw new Error(genericError);
    if (record.code !== args.code) throw new Error(genericError);

    await ctx.db.patch(record._id, { consumedAt: Date.now() });
    return { userId: user._id, email: user.email };
  },
});
