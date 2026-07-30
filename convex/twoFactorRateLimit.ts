import { v } from "convex/values";
import { internalMutation } from "./_generated/server";

// Same token-bucket shape Convex Auth uses internally for password attempts
// (10/hour, refilling continuously rather than a hard reset window, so a
// burst-then-wait pattern doesn't just reset the clock).
const MAX_ATTEMPTS_PER_HOUR = 10;
const ONE_HOUR_MS = 60 * 60 * 1000;

export const checkAndConsumeAttemptInternal = internalMutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const now = Date.now();
    const existing = await ctx.db
      .query("twoFactorAttempts")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .unique();

    if (!existing) {
      await ctx.db.insert("twoFactorAttempts", {
        userId: args.userId,
        attemptsLeft: MAX_ATTEMPTS_PER_HOUR - 1,
        lastAttemptTime: now,
      });
      return { allowed: true };
    }

    const elapsed = now - existing.lastAttemptTime;
    const refillPerMs = MAX_ATTEMPTS_PER_HOUR / ONE_HOUR_MS;
    const attemptsLeft = Math.min(MAX_ATTEMPTS_PER_HOUR, existing.attemptsLeft + elapsed * refillPerMs);

    if (attemptsLeft < 1) {
      return { allowed: false };
    }

    await ctx.db.patch(existing._id, { attemptsLeft: attemptsLeft - 1, lastAttemptTime: now });
    return { allowed: true };
  },
});

export const resetAttemptsInternal = internalMutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("twoFactorAttempts")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .unique();
    if (existing) await ctx.db.delete(existing._id);
  },
});
