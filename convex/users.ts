import { v } from "convex/values";
import { paginationOptsValidator, type PaginationResult } from "convex/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { internalQuery, mutation, query } from "./_generated/server";
import type { QueryCtx } from "./_generated/server";
import type { Doc } from "./_generated/dataModel";
import { requireAdmin } from "./model/authz";
import { logAdminAction } from "./model/audit";
import { currencyValidator } from "./schema";
import { applyDelta } from "../lib/money";

export const getCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    return await ctx.db.get(userId);
  },
});

// --- Admin (Phase 4) ---

const MAX_SEARCH_RESULTS = 50;

async function withReferralCounts(ctx: QueryCtx, users: Doc<"users">[]) {
  return await Promise.all(
    users.map(async (u) => {
      const referrals = await ctx.db
        .query("referrals")
        .withIndex("by_referrerId", (q) => q.eq("referrerId", u._id))
        .collect();
      return { ...u, referralCount: referrals.length };
    }),
  );
}

// Two modes, since free-text substring search can't run through a cursor
// index: with no `search`, this is a real cursor-paginated browse of every
// user (`.paginate()`); with `search`, it scans + filters in-memory and
// returns everything that matches (capped at MAX_SEARCH_RESULTS) as a single
// already-`isDone` page -- still a valid `usePaginatedQuery` result shape,
// it just never has a next page to load.
export const listForAdmin = query({
  args: { paginationOpts: paginationOptsValidator, search: v.optional(v.string()) },
  handler: async (ctx, args): Promise<PaginationResult<Doc<"users"> & { referralCount: number }>> => {
    await requireAdmin(ctx);

    const term = args.search?.trim().toLowerCase();
    if (term) {
      const allUsers = await ctx.db.query("users").order("desc").collect();
      const filtered = allUsers
        .filter((u) => u.email.toLowerCase().includes(term))
        .slice(0, MAX_SEARCH_RESULTS);
      const page = await withReferralCounts(ctx, filtered);
      return { page, isDone: true, continueCursor: "" };
    }

    const result = await ctx.db.query("users").order("desc").paginate(args.paginationOpts);
    const page = await withReferralCounts(ctx, result.page);
    return { ...result, page };
  },
});

export const getDetailForAdmin = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const user = await ctx.db.get(args.userId);
    if (!user) throw new Error("User not found");

    const [transactions, investments, deposits, withdrawals] = await Promise.all([
      ctx.db
        .query("transactions")
        .withIndex("by_userId", (q) => q.eq("userId", args.userId))
        .order("desc")
        .collect(),
      ctx.db
        .query("investments")
        .withIndex("by_userId", (q) => q.eq("userId", args.userId))
        .order("desc")
        .collect(),
      ctx.db
        .query("deposits")
        .withIndex("by_userId", (q) => q.eq("userId", args.userId))
        .order("desc")
        .collect(),
      ctx.db
        .query("withdrawals")
        .withIndex("by_userId", (q) => q.eq("userId", args.userId))
        .order("desc")
        .collect(),
    ]);

    return { user, transactions, investments, deposits, withdrawals };
  },
});

// The one place manual ledger writes are allowed outside an approval flow --
// deliberately requires a note every time, since this bypasses the normal
// deposit/withdrawal/investment audit trail (see docs/05-phase-4-admin-panel.md
// 4.4). Should be rare.
export const adjustBalance = mutation({
  args: {
    userId: v.id("users"),
    currency: currencyValidator,
    delta: v.number(),
    note: v.string(),
  },
  handler: async (ctx, args) => {
    const admin = await requireAdmin(ctx);
    if (args.note.trim().length < 5) {
      throw new Error("A note (at least 5 characters) is required for a manual adjustment");
    }
    if (!Number.isFinite(args.delta) || args.delta === 0) {
      throw new Error("Delta must be a non-zero finite number");
    }

    const user = await ctx.db.get(args.userId);
    if (!user) throw new Error("User not found");

    const balanceBefore = user.balances[args.currency];
    const balanceAfter = applyDelta(balanceBefore, args.delta);
    await ctx.db.patch(user._id, {
      balances: { ...user.balances, [args.currency]: balanceAfter },
    });

    await ctx.db.insert("transactions", {
      userId: user._id,
      type: "admin_adjustment",
      amount: args.delta,
      currency: args.currency,
      balanceBefore,
      balanceAfter,
      relatedId: undefined,
      performedBy: admin._id,
      note: args.note.trim(),
      createdAt: Date.now(),
    });

    await logAdminAction(ctx, {
      adminId: admin._id,
      action: "admin_adjustment",
      targetTable: "users",
      targetId: user._id,
      before: { balance: balanceBefore },
      after: { balance: balanceAfter, note: args.note.trim() },
    });
  },
});

export const listAdminsInternal = internalQuery({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("users")
      .withIndex("by_role", (q) => q.eq("role", "admin"))
      .collect();
  },
});

export const setStatus = mutation({
  args: {
    userId: v.id("users"),
    status: v.union(v.literal("active"), v.literal("suspended"), v.literal("banned")),
  },
  handler: async (ctx, args) => {
    const admin = await requireAdmin(ctx);
    const user = await ctx.db.get(args.userId);
    if (!user) throw new Error("User not found");

    await ctx.db.patch(user._id, { status: args.status });

    await logAdminAction(ctx, {
      adminId: admin._id,
      action: "set_user_status",
      targetTable: "users",
      targetId: user._id,
      before: { status: user.status },
      after: { status: args.status },
    });
  },
});
