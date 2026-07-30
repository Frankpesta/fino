"use node";

// Password hashing (Scrypt via Password.js's `lucia` dependency) and the
// Convex Auth account/session helpers below require the full Node runtime,
// not the default V8 isolate -- hence this file is separate from
// convex/profile.ts and marked "use node". Files with that directive may
// only export `action`s, never `query`/`mutation` (Convex restriction),
// which is why the plain db reads/writes these actions need are split out
// into internalQuery helpers in convex/profile.ts that they call via
// ctx.runQuery.
import { v } from "convex/values";
import {
  getAuthUserId,
  getAuthSessionId,
  retrieveAccount,
  modifyAccountCredentials,
  invalidateSessions,
} from "@convex-dev/auth/server";
import { action } from "./_generated/server";
import { internal } from "./_generated/api";

export const changePassword = action({
  args: { currentPassword: v.string(), newPassword: v.string() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    if (args.newPassword.length < 8) {
      throw new Error("New password must be at least 8 characters");
    }

    const user = await ctx.runQuery(internal.profile.getUserInternal, { userId });
    if (!user) throw new Error("User not found");

    // retrieveAccount returns null if the account doesn't exist at all, but
    // *throws* (e.g. an "InvalidSecret" error) when the account exists and
    // the secret just doesn't match -- both cases mean "incorrect password"
    // from this caller's perspective.
    let retrieved;
    try {
      retrieved = await retrieveAccount(ctx, {
        provider: "password",
        account: { id: user.email, secret: args.currentPassword },
      });
    } catch {
      retrieved = null;
    }
    if (!retrieved) throw new Error("Current password is incorrect");

    await modifyAccountCredentials(ctx, {
      provider: "password",
      account: { id: user.email, secret: args.newPassword },
    });

    // Log out every other session on a password change -- standard security
    // hygiene. Keeps the session making this request active.
    const currentSessionId = await getAuthSessionId(ctx);
    await invalidateSessions(ctx, {
      userId,
      except: currentSessionId ? [currentSessionId] : [],
    });

    await ctx.scheduler.runAfter(0, internal.emails.sendSecurityNotice, {
      userId,
      message:
        "Your password was just changed. Every other session has been signed out for your security.",
    });
  },
});

export const revokeSession = action({
  args: { sessionId: v.id("authSessions") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const ownSessionIds = await ctx.runQuery(internal.profile.listSessionIdsInternal, {
      userId,
    });
    if (!ownSessionIds.includes(args.sessionId)) {
      throw new Error("Session not found");
    }

    const except = ownSessionIds.filter((id) => id !== args.sessionId);
    await invalidateSessions(ctx, { userId, except });
  },
});
