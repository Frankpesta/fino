import { v } from "convex/values";
import { internalMutation } from "./_generated/server";

// Every send attempt (success or failure) gets a row here, independent of
// Resend's own dashboard -- see docs/07-phase-6-emails-notifications.md 6.3.
export const logAttempt = internalMutation({
  args: {
    userId: v.optional(v.id("users")),
    to: v.string(),
    template: v.string(),
    status: v.union(v.literal("sent"), v.literal("failed")),
    error: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("emailLog", { ...args, createdAt: Date.now() });
  },
});
