import { v } from "convex/values";
import { mutation, internalAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { requireUser } from "./model/authz";
import {
  generateVerificationCode,
  isExpired,
  canResend,
  VERIFICATION_CODE_TTL_MS,
} from "../lib/verificationCode";

export const verifyCode = mutation({
  args: { code: v.string() },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    if (user.emailVerified) {
      return { success: true as const };
    }

    const record = await ctx.db
      .query("emailVerifications")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .order("desc")
      .first();

    if (!record) throw new Error("No verification code on file");
    if (record.consumedAt) throw new Error("Code already used");
    if (isExpired(record.expiresAt, Date.now())) throw new Error("Code expired");
    if (record.code !== args.code) throw new Error("Incorrect code");

    await ctx.db.patch(record._id, { consumedAt: Date.now() });
    await ctx.db.patch(user._id, { emailVerified: true });
    await ctx.scheduler.runAfter(0, internal.emailVerification.sendWelcomeEmail, {
      userId: user._id,
    });

    return { success: true as const };
  },
});

export const resendCode = mutation({
  args: {},
  handler: async (ctx) => {
    const user = await requireUser(ctx);
    if (user.emailVerified) {
      throw new Error("Email already verified");
    }

    const latest = await ctx.db
      .query("emailVerifications")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .order("desc")
      .first();

    const now = Date.now();
    if (latest && !canResend(latest.lastSentAt, now)) {
      throw new Error("Please wait before requesting another code");
    }

    const code = generateVerificationCode();
    await ctx.db.insert("emailVerifications", {
      userId: user._id,
      code,
      expiresAt: now + VERIFICATION_CODE_TTL_MS,
      lastSentAt: now,
    });
    await ctx.scheduler.runAfter(0, internal.emailVerification.sendVerificationEmail, {
      userId: user._id,
      code,
    });

    return { success: true as const };
  },
});

// Stubs until Phase 6 wires these to Resend + react-email templates (see
// docs/07-phase-6-emails-notifications.md). Kept as scheduled actions now so
// swapping in real sends later doesn't change any mutation's shape.
export const sendVerificationEmail = internalAction({
  args: { userId: v.id("users"), code: v.string() },
  handler: async (_ctx, args) => {
    console.log(`[email:verification] userId=${args.userId} code=${args.code}`);
  },
});

export const sendWelcomeEmail = internalAction({
  args: { userId: v.id("users") },
  handler: async (_ctx, args) => {
    console.log(`[email:welcome] userId=${args.userId}`);
  },
});
