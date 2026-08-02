import { v } from "convex/values";
import { mutation, internalAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { requireUser } from "./model/authz";
import { deliverEmail } from "./model/email";
import {
  generateVerificationCode,
  isExpired,
  canResend,
  VERIFICATION_CODE_TTL_MS,
} from "../lib/verificationCode";
import { VerificationCodeEmail } from "../emails/VerificationCodeEmail";
import { WelcomeEmail } from "../emails/WelcomeEmail";

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

// Security-critical -- always sends regardless of notification preferences
// (see docs/07-phase-6-emails-notifications.md 6.3).
export const sendVerificationEmail = internalAction({
  args: { userId: v.id("users"), code: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.runQuery(internal.profile.getUserInternal, { userId: args.userId });
    if (!user) return;
    await deliverEmail(ctx, {
      to: user.email,
      subject: "Verify your email",
      react: VerificationCodeEmail({ code: args.code }),
      template: "verification_code",
      userId: user._id,
    });
  },
});

export const sendWelcomeEmail = internalAction({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const user = await ctx.runQuery(internal.profile.getUserInternal, { userId: args.userId });
    if (!user) return;
    await deliverEmail(ctx, {
      to: user.email,
      subject: "Welcome to Zypherex",
      react: WelcomeEmail(),
      template: "welcome",
      userId: user._id,
    });
  },
});
