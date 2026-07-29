import { v } from "convex/values";
import { mutation, query, type QueryCtx } from "./_generated/server";
import { requireVerifiedUser } from "./model/authz";
import { currencyValidator } from "./schema";
import { addMoney, subtractMoney } from "../lib/money";
import type { Doc, Id } from "./_generated/dataModel";

const withdrawalStatusValidator = v.union(
  v.literal("pending"),
  v.literal("approved"),
  v.literal("rejected"),
  v.literal("cancelled"),
);

// Sum of this user's still-pending withdrawal requests for a currency --
// funds reserved but not yet deducted from `users.balances` (that only
// happens on admin approval, Phase 4). See docs/03-phase-2-user-dashboard.md
// 2.3: "Do not decrement balance yet -- only reserve/hold it."
async function heldForWithdrawal(
  ctx: QueryCtx,
  userId: Id<"users">,
  currency: Doc<"withdrawals">["currency"],
) {
  const pending = await ctx.db
    .query("withdrawals")
    .withIndex("by_userId", (q) => q.eq("userId", userId))
    .filter((q) => q.eq(q.field("status"), "pending"))
    .collect();
  return pending
    .filter((w) => w.currency === currency)
    .reduce((sum, w) => addMoney(sum, w.amount), 0);
}

export const listMine = query({
  args: { status: v.optional(withdrawalStatusValidator) },
  handler: async (ctx, args) => {
    const user = await requireVerifiedUser(ctx);
    const withdrawals = await ctx.db
      .query("withdrawals")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .order("desc")
      .collect();
    return args.status ? withdrawals.filter((w) => w.status === args.status) : withdrawals;
  },
});

// Available balance is `users.balances[currency]` minus whatever this user
// already has tied up in other pending withdrawal requests. Funds locked in
// active investments are never in `balances` in the first place (investing
// decrements it at investment time), so no separate check is needed for
// those.
export const getAvailableBalance = query({
  args: { currency: currencyValidator },
  handler: async (ctx, args) => {
    const user = await requireVerifiedUser(ctx);
    const held = await heldForWithdrawal(ctx, user._id, args.currency);
    return subtractMoney(user.balances[args.currency], held);
  },
});

export const create = mutation({
  args: {
    amount: v.number(),
    currency: currencyValidator,
    destinationAddress: v.string(),
    note: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await requireVerifiedUser(ctx);

    if (!Number.isFinite(args.amount) || args.amount <= 0) {
      throw new Error("Amount must be greater than zero");
    }
    if (args.destinationAddress.trim().length === 0) {
      throw new Error("Destination address is required");
    }

    const held = await heldForWithdrawal(ctx, user._id, args.currency);
    const available = subtractMoney(user.balances[args.currency], held);
    if (args.amount > available) {
      throw new Error(
        `Amount exceeds available balance (${available} ${args.currency} available)`,
      );
    }

    return await ctx.db.insert("withdrawals", {
      userId: user._id,
      amount: args.amount,
      currency: args.currency,
      destinationAddress: args.destinationAddress,
      note: args.note,
      status: "pending",
      reviewedBy: undefined,
      reviewedAt: undefined,
      rejectionReason: undefined,
      payoutTxHash: undefined,
      createdAt: Date.now(),
    });
  },
});

export const cancel = mutation({
  args: { withdrawalId: v.id("withdrawals") },
  handler: async (ctx, args) => {
    const user = await requireVerifiedUser(ctx);
    const withdrawal = await ctx.db.get(args.withdrawalId);

    if (!withdrawal || withdrawal.userId !== user._id) {
      throw new Error("Withdrawal not found");
    }
    if (withdrawal.status !== "pending") {
      throw new Error(`Cannot cancel a withdrawal that is already ${withdrawal.status}`);
    }

    // Never touched `balances` on creation, so nothing to reverse -- just
    // flip status (soft-cancel keeps the audit trail, same pattern as
    // deposits).
    await ctx.db.patch(args.withdrawalId, { status: "cancelled" });
  },
});
