import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { internal } from "./_generated/api";
import { requireAdmin, requireVerifiedUser } from "./model/authz";
import { logAdminAction } from "./model/audit";
import { currencyValidator } from "./schema";
import { getAvailableBalance as getAvailableBalanceHelper } from "./model/balances";
import { getMinWithdrawalAmount } from "./model/settings";
import { applyDelta } from "../lib/money";

const withdrawalStatusValidator = v.union(
  v.literal("pending"),
  v.literal("approved"),
  v.literal("rejected"),
  v.literal("cancelled"),
);

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
    return await getAvailableBalanceHelper(ctx, user, args.currency);
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

    const minAmount = await getMinWithdrawalAmount(ctx, args.currency);
    if (args.amount < minAmount) {
      throw new Error(`Minimum withdrawal for ${args.currency} is ${minAmount}`);
    }

    const available = await getAvailableBalanceHelper(ctx, user, args.currency);
    if (args.amount > available) {
      throw new Error(
        `Amount exceeds available balance (${available} ${args.currency} available)`,
      );
    }

    const withdrawalId = await ctx.db.insert("withdrawals", {
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

    await ctx.scheduler.runAfter(0, internal.emails.sendWithdrawalSubmitted, {
      userId: user._id,
      amount: args.amount,
      currency: args.currency,
    });

    return withdrawalId;
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

// --- Admin (Phase 4) ---

export const listForAdmin = query({
  args: { status: v.optional(withdrawalStatusValidator) },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const withdrawals = args.status
      ? await ctx.db
          .query("withdrawals")
          .withIndex("by_status", (q) => q.eq("status", args.status!))
          .order("desc")
          .collect()
      : await ctx.db.query("withdrawals").order("desc").collect();

    return await Promise.all(
      withdrawals.map(async (withdrawal) => {
        const user = await ctx.db.get(withdrawal.userId);
        return { ...withdrawal, userEmail: user?.email ?? "unknown" };
      }),
    );
  },
});

// Approve re-validates the balance at approval time (not just whatever it
// was at request time) -- other approvals, admin adjustments, or investments
// could have changed it since. This is a hard money-safety check, not just
// UX: approving twice or over-approving must be impossible.
export const approve = mutation({
  args: { withdrawalId: v.id("withdrawals"), payoutTxHash: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const admin = await requireAdmin(ctx);
    const withdrawal = await ctx.db.get(args.withdrawalId);
    if (!withdrawal) throw new Error("Withdrawal not found");
    if (withdrawal.status !== "pending") {
      throw new Error(`Cannot approve a withdrawal that is already ${withdrawal.status}`);
    }

    const user = await ctx.db.get(withdrawal.userId);
    if (!user) throw new Error("User account not found");

    const balanceBefore = user.balances[withdrawal.currency];
    if (withdrawal.amount > balanceBefore) {
      throw new Error(
        `Balance no longer covers this withdrawal (current balance ${balanceBefore} ${withdrawal.currency})`,
      );
    }
    const balanceAfter = applyDelta(balanceBefore, -withdrawal.amount);
    await ctx.db.patch(user._id, {
      balances: { ...user.balances, [withdrawal.currency]: balanceAfter },
    });

    const now = Date.now();
    await ctx.db.patch(args.withdrawalId, {
      status: "approved",
      reviewedBy: admin._id,
      reviewedAt: now,
      payoutTxHash: args.payoutTxHash?.trim() || undefined,
    });

    await ctx.db.insert("transactions", {
      userId: user._id,
      type: "withdrawal",
      amount: withdrawal.amount,
      currency: withdrawal.currency,
      balanceBefore,
      balanceAfter,
      relatedId: args.withdrawalId,
      performedBy: admin._id,
      note: "Withdrawal approved",
      createdAt: now,
    });

    await logAdminAction(ctx, {
      adminId: admin._id,
      action: "approve_withdrawal",
      targetTable: "withdrawals",
      targetId: args.withdrawalId,
      before: { status: "pending" },
      after: { status: "approved" },
    });

    await ctx.scheduler.runAfter(0, internal.emails.sendWithdrawalApproved, {
      userId: user._id,
      amount: withdrawal.amount,
      currency: withdrawal.currency,
      payoutTxHash: args.payoutTxHash?.trim() || undefined,
    });
  },
});

// This build doesn't broadcast on-chain transactions itself (see
// docs/05-phase-4-admin-panel.md 4.3 scope note) -- the admin sends the
// payout through their own custody tooling, then pastes the tx hash here,
// often as a follow-up action after `approve`.
export const recordPayoutTxHash = mutation({
  args: { withdrawalId: v.id("withdrawals"), payoutTxHash: v.string() },
  handler: async (ctx, args) => {
    const admin = await requireAdmin(ctx);
    const withdrawal = await ctx.db.get(args.withdrawalId);
    if (!withdrawal) throw new Error("Withdrawal not found");
    if (withdrawal.status !== "approved") {
      throw new Error("Can only record a payout tx hash on an approved withdrawal");
    }
    if (args.payoutTxHash.trim().length === 0) {
      throw new Error("Tx hash cannot be empty");
    }

    await ctx.db.patch(args.withdrawalId, { payoutTxHash: args.payoutTxHash.trim() });
    await logAdminAction(ctx, {
      adminId: admin._id,
      action: "record_payout_tx_hash",
      targetTable: "withdrawals",
      targetId: args.withdrawalId,
      after: { payoutTxHash: args.payoutTxHash.trim() },
    });
  },
});

// Funds were never deducted on request, so rejecting is a pure status flip
// -- nothing to reverse.
export const reject = mutation({
  args: { withdrawalId: v.id("withdrawals"), rejectionReason: v.string() },
  handler: async (ctx, args) => {
    const admin = await requireAdmin(ctx);
    const withdrawal = await ctx.db.get(args.withdrawalId);
    if (!withdrawal) throw new Error("Withdrawal not found");
    if (withdrawal.status !== "pending") {
      throw new Error(`Cannot reject a withdrawal that is already ${withdrawal.status}`);
    }
    if (args.rejectionReason.trim().length === 0) {
      throw new Error("A rejection reason is required");
    }

    const reason = args.rejectionReason.trim();
    await ctx.db.patch(args.withdrawalId, {
      status: "rejected",
      reviewedBy: admin._id,
      reviewedAt: Date.now(),
      rejectionReason: reason,
    });

    await logAdminAction(ctx, {
      adminId: admin._id,
      action: "reject_withdrawal",
      targetTable: "withdrawals",
      targetId: args.withdrawalId,
      before: { status: "pending" },
      after: { status: "rejected", rejectionReason: reason },
    });

    await ctx.scheduler.runAfter(0, internal.emails.sendWithdrawalRejected, {
      userId: withdrawal.userId,
      amount: withdrawal.amount,
      currency: withdrawal.currency,
      reason,
    });
  },
});
