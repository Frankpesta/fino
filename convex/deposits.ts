import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireAdmin, requireVerifiedUser } from "./model/authz";
import { logAdminAction } from "./model/audit";
import { currencyValidator } from "./schema";
import { applyDelta, multiplyMoney, addMoney } from "../lib/money";

const depositStatusValidator = v.union(
  v.literal("pending"),
  v.literal("approved"),
  v.literal("rejected"),
  v.literal("cancelled"),
);

export const listMine = query({
  args: { status: v.optional(depositStatusValidator) },
  handler: async (ctx, args) => {
    const user = await requireVerifiedUser(ctx);
    const deposits = await ctx.db
      .query("deposits")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .order("desc")
      .collect();
    return args.status ? deposits.filter((d) => d.status === args.status) : deposits;
  },
});

// Creates a pending deposit request. Never touches `users.balances` -- that
// only happens when an admin approves it (Phase 4). The receiving address is
// looked up server-side from `platformWallets`, never trusted from the
// client, so a compromised client can't record a bogus destination.
export const create = mutation({
  args: {
    amount: v.number(),
    currency: currencyValidator,
    txHash: v.optional(v.string()),
    proofFileId: v.optional(v.id("_storage")),
  },
  handler: async (ctx, args) => {
    const user = await requireVerifiedUser(ctx);

    if (!Number.isFinite(args.amount) || args.amount <= 0) {
      throw new Error("Amount must be greater than zero");
    }

    const wallet = await ctx.db
      .query("platformWallets")
      .withIndex("by_currency", (q) => q.eq("currency", args.currency))
      .unique();

    if (!wallet || !wallet.isActive) {
      throw new Error(`No active deposit address configured for ${args.currency} yet`);
    }

    return await ctx.db.insert("deposits", {
      userId: user._id,
      amount: args.amount,
      currency: args.currency,
      destinationWalletAddress: wallet.address,
      proofFileId: args.proofFileId,
      txHash: args.txHash,
      status: "pending",
      reviewedBy: undefined,
      reviewedAt: undefined,
      rejectionReason: undefined,
      createdAt: Date.now(),
    });
  },
});

export const cancel = mutation({
  args: { depositId: v.id("deposits") },
  handler: async (ctx, args) => {
    const user = await requireVerifiedUser(ctx);
    const deposit = await ctx.db.get(args.depositId);

    if (!deposit || deposit.userId !== user._id) {
      throw new Error("Deposit not found");
    }
    if (deposit.status !== "pending") {
      throw new Error(`Cannot cancel a deposit that is already ${deposit.status}`);
    }

    await ctx.db.patch(args.depositId, { status: "cancelled" });
  },
});

export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    await requireVerifiedUser(ctx);
    return await ctx.storage.generateUploadUrl();
  },
});

// --- Admin (Phase 4) ---

export const listForAdmin = query({
  args: { status: v.optional(depositStatusValidator) },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const deposits = args.status
      ? await ctx.db
          .query("deposits")
          .withIndex("by_status", (q) => q.eq("status", args.status!))
          .order("desc")
          .collect()
      : await ctx.db.query("deposits").order("desc").collect();

    return await Promise.all(
      deposits.map(async (deposit) => {
        const user = await ctx.db.get(deposit.userId);
        return { ...deposit, userEmail: user?.email ?? "unknown" };
      }),
    );
  },
});

export const getProofUrl = query({
  args: { depositId: v.id("deposits") },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const deposit = await ctx.db.get(args.depositId);
    if (!deposit?.proofFileId) return null;
    return await ctx.storage.getUrl(deposit.proofFileId);
  },
});

// Approve: credits the depositor's balance, logs the ledger entry + audit
// row, and -- if the depositor was referred -- credits the referrer's
// commission right here (deposit approval, not signup, is the commission
// trigger; see docs/06-phase-5-referrals-profile.md 5.1). The full referral
// dashboard lands in Phase 5, but this hook is safe to wire now: it's a
// no-op until a `referrals` row actually exists for someone.
export const approve = mutation({
  args: { depositId: v.id("deposits") },
  handler: async (ctx, args) => {
    const admin = await requireAdmin(ctx);
    const deposit = await ctx.db.get(args.depositId);
    if (!deposit) throw new Error("Deposit not found");
    if (deposit.status !== "pending") {
      throw new Error(`Cannot approve a deposit that is already ${deposit.status}`);
    }

    const depositor = await ctx.db.get(deposit.userId);
    if (!depositor) throw new Error("Depositor account not found");

    const balanceBefore = depositor.balances[deposit.currency];
    const balanceAfter = applyDelta(balanceBefore, deposit.amount);
    await ctx.db.patch(depositor._id, {
      balances: { ...depositor.balances, [deposit.currency]: balanceAfter },
    });

    const now = Date.now();
    await ctx.db.patch(args.depositId, {
      status: "approved",
      reviewedBy: admin._id,
      reviewedAt: now,
    });

    await ctx.db.insert("transactions", {
      userId: depositor._id,
      type: "deposit",
      amount: deposit.amount,
      currency: deposit.currency,
      balanceBefore,
      balanceAfter,
      relatedId: args.depositId,
      performedBy: admin._id,
      note: "Deposit approved",
      createdAt: now,
    });

    await logAdminAction(ctx, {
      adminId: admin._id,
      action: "approve_deposit",
      targetTable: "deposits",
      targetId: args.depositId,
      before: { status: "pending" },
      after: { status: "approved" },
    });

    const referral = await ctx.db
      .query("referrals")
      .withIndex("by_referredUserId", (q) => q.eq("referredUserId", depositor._id))
      .unique();
    if (referral) {
      const referrer = await ctx.db.get(referral.referrerId);
      if (referrer) {
        const commission = multiplyMoney(deposit.amount, referral.commissionRate);
        const referrerBalanceBefore = referrer.balances[deposit.currency];
        const referrerBalanceAfter = applyDelta(referrerBalanceBefore, commission);
        await ctx.db.patch(referrer._id, {
          balances: { ...referrer.balances, [deposit.currency]: referrerBalanceAfter },
        });
        await ctx.db.insert("transactions", {
          userId: referrer._id,
          type: "referral_commission",
          amount: commission,
          currency: deposit.currency,
          balanceBefore: referrerBalanceBefore,
          balanceAfter: referrerBalanceAfter,
          relatedId: args.depositId,
          performedBy: admin._id,
          note: "Referral commission",
          createdAt: now,
        });
        await ctx.db.patch(referral._id, {
          totalCommissionEarned: addMoney(referral.totalCommissionEarned, commission),
        });
      }
    }
  },
});

export const reject = mutation({
  args: { depositId: v.id("deposits"), rejectionReason: v.string() },
  handler: async (ctx, args) => {
    const admin = await requireAdmin(ctx);
    const deposit = await ctx.db.get(args.depositId);
    if (!deposit) throw new Error("Deposit not found");
    if (deposit.status !== "pending") {
      throw new Error(`Cannot reject a deposit that is already ${deposit.status}`);
    }
    if (args.rejectionReason.trim().length === 0) {
      throw new Error("A rejection reason is required");
    }

    await ctx.db.patch(args.depositId, {
      status: "rejected",
      reviewedBy: admin._id,
      reviewedAt: Date.now(),
      rejectionReason: args.rejectionReason.trim(),
    });

    await logAdminAction(ctx, {
      adminId: admin._id,
      action: "reject_deposit",
      targetTable: "deposits",
      targetId: args.depositId,
      before: { status: "pending" },
      after: { status: "rejected", rejectionReason: args.rejectionReason.trim() },
    });
  },
});
