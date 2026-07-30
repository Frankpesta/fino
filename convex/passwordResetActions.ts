"use node";

// modifyAccountCredentials/invalidateSessions need the full Node runtime --
// same reasoning as convex/profileActions.ts.
import { v } from "convex/values";
import { modifyAccountCredentials, invalidateSessions } from "@convex-dev/auth/server";
import { action } from "./_generated/server";
import { internal } from "./_generated/api";

export const confirmReset = action({
  args: { email: v.string(), code: v.string(), newPassword: v.string() },
  handler: async (ctx, args) => {
    if (args.newPassword.length < 8) {
      throw new Error("New password must be at least 8 characters");
    }

    const { userId, email } = await ctx.runMutation(
      internal.passwordReset.validateAndConsumeResetCodeInternal,
      { email: args.email, code: args.code },
    );

    await modifyAccountCredentials(ctx, {
      provider: "password",
      account: { id: email, secret: args.newPassword },
    });

    // Unlike an authenticated password change, there's no "current session"
    // to keep alive here -- the user wasn't signed in (that's the whole
    // point of forgot-password). Sign out everywhere; they log back in
    // fresh with the new password.
    await invalidateSessions(ctx, { userId, except: [] });

    await ctx.scheduler.runAfter(0, internal.emails.sendSecurityNotice, {
      userId,
      message:
        "Your password was just reset via the forgot-password flow. If this wasn't you, contact support immediately.",
    });
  },
});
