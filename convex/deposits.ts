import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { internal } from "./_generated/api";
import { requireAdmin, requireVerifiedUser } from "./model/authz";
import { logAdminAction } from "./model/audit";
import { getCachedUsdRate } from "./model/exchangeRates";
import { currencyValidator } from "./schema";
import { applyDelta, multiplyMoney, addMoney, round8 } from "../lib/money";
import { maskEmail } from "../lib/maskEmail";
import { validateProofUpload } from "../lib/fileValidation";
import { findMatchingPlan } from "../lib/planMatching";
import { computeEndsAt } from "../lib/investmentMath";

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
//
// The user enters a USD amount, not a coin amount -- the equivalent
// native-currency amount to send is computed here from the cached live
// rate, and the plan they'll be invested into is matched here too (both
// re-derived server-side, never trusted from the client's own quote/match,
// since the price or the set of active plans can move between when the
// client last quoted and when this actually runs). A deposit that doesn't
// land inside any active plan's range is rejected outright -- every deposit
// on this platform funds an investment, there's no "just add to balance"
// path anymore.
export const create = mutation({
  args: {
    amountUsd: v.number(),
    currency: currencyValidator,
    txHash: v.string(),
    proofFileId: v.optional(v.id("_storage")),
  },
  handler: async (ctx, args) => {
    const user = await requireVerifiedUser(ctx);

    if (!Number.isFinite(args.amountUsd) || args.amountUsd <= 0) {
      throw new Error("Amount must be greater than zero");
    }
    if (args.txHash.trim().length === 0) {
      throw new Error("Transaction hash is required");
    }

    const wallet = await ctx.db
      .query("platformWallets")
      .withIndex("by_currency", (q) => q.eq("currency", args.currency))
      .unique();

    if (!wallet || !wallet.isActive) {
      throw new Error(`No active deposit address configured for ${args.currency} yet`);
    }

    const quotedRate = await getCachedUsdRate(ctx, args.currency);
    if (quotedRate <= 0) {
      throw new Error(
        "Live pricing isn't available for this currency right now -- try again shortly",
      );
    }

    const activePlans = await ctx.db
      .query("investmentPlans")
      .withIndex("by_isActive", (q) => q.eq("isActive", true))
      .collect();
    const matchedPlan = findMatchingPlan(activePlans, {
      currency: args.currency,
      amountUsd: args.amountUsd,
    });
    if (!matchedPlan) {
      throw new Error("This amount doesn't fall within any active investment plan's range");
    }

    // Server-side upload validation -- the client's `accept="image/*"` on
    // the file input is trivially bypassed, so this is the actual
    // enforcement. See lib/fileValidation.ts.
    if (args.proofFileId) {
      const meta = await ctx.db.system.get(args.proofFileId);
      if (!meta) {
        throw new Error("Proof upload not found");
      }
      try {
        validateProofUpload(meta);
      } catch (err) {
        await ctx.storage.delete(args.proofFileId);
        throw err;
      }
    }

    const amount = round8(args.amountUsd / quotedRate);

    const depositId = await ctx.db.insert("deposits", {
      userId: user._id,
      amount,
      currency: args.currency,
      amountUsd: args.amountUsd,
      quotedRate,
      matchedPlanId: matchedPlan._id,
      destinationWalletAddress: wallet.address,
      proofFileId: args.proofFileId,
      txHash: args.txHash.trim(),
      status: "pending",
      reviewedBy: undefined,
      reviewedAt: undefined,
      rejectionReason: undefined,
      createdAt: Date.now(),
    });

    await ctx.scheduler.runAfter(0, internal.emails.sendDepositSubmitted, {
      userId: user._id,
      amount,
      currency: args.currency,
    });

    return depositId;
  },
});

// Live preview for the deposit wizard -- same rate lookup and matching logic
// as `create` (imported from the same lib/planMatching helper), so what the
// user is shown before submitting can't drift from what actually happens on
// submit. Returns nulls/zeros rather than throwing so the UI can render an
// inline "no plan matches yet" state instead of an error while the user is
// still typing.
export const quote = query({
  args: { amountUsd: v.number(), currency: currencyValidator },
  handler: async (ctx, args) => {
    await requireVerifiedUser(ctx);

    const quotedRate = await getCachedUsdRate(ctx, args.currency);
    if (!Number.isFinite(args.amountUsd) || args.amountUsd <= 0 || quotedRate <= 0) {
      return { quotedRate, cryptoAmount: 0, matchedPlan: null };
    }

    const activePlans = await ctx.db
      .query("investmentPlans")
      .withIndex("by_isActive", (q) => q.eq("isActive", true))
      .collect();
    const matchedPlan = findMatchingPlan(activePlans, {
      currency: args.currency,
      amountUsd: args.amountUsd,
    });

    return {
      quotedRate,
      cryptoAmount: round8(args.amountUsd / quotedRate),
      matchedPlan,
    };
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
        const plan = deposit.matchedPlanId ? await ctx.db.get(deposit.matchedPlanId) : null;
        return {
          ...deposit,
          userEmail: user?.email ?? "unknown",
          matchedPlanName: plan?.name ?? null,
        };
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

// Approve: credits the depositor's balance, immediately invests the full
// amount into the plan matched at submission time (locking that plan's
// *current* rate/rateInterval/payoutStyle onto the new investment, same as
// convex/investments.ts's `invest` -- approval is "investment time" for a
// deposit-funded investment, since that's the first moment the funds are
// confirmed real), logs both ledger entries + an audit row, and -- if the
// depositor was referred -- credits the referrer's commission on the
// original deposit amount (deposit approval, not signup, is the commission
// trigger; see docs/06-phase-5-referrals-profile.md 5.1).
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

    // The plan matched at submission time may have since been deactivated or
    // deleted by an admin -- rather than silently re-matching a possibly
    // different plan the user never saw or agreed to, this forces a manual
    // resolution (reject and ask the user to resubmit, or reactivate the
    // plan) instead of guessing.
    let plan = null;
    if (deposit.matchedPlanId) {
      plan = await ctx.db.get(deposit.matchedPlanId);
      if (!plan || !plan.isActive) {
        throw new Error(
          "The plan matched to this deposit is no longer active -- reject this deposit and ask the user to resubmit, or reactivate the plan first",
        );
      }
    }

    const balanceBefore = depositor.balances[deposit.currency];
    const balanceAfterDeposit = applyDelta(balanceBefore, deposit.amount);

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
      balanceAfter: balanceAfterDeposit,
      relatedId: args.depositId,
      performedBy: admin._id,
      note: "Deposit approved",
      createdAt: now,
    });

    let balanceAfter = balanceAfterDeposit;
    if (plan) {
      const balanceAfterInvestment = applyDelta(balanceAfterDeposit, -deposit.amount);
      const investmentId = await ctx.db.insert("investments", {
        userId: depositor._id,
        planId: plan._id,
        principal: deposit.amount,
        currency: deposit.currency,
        rate: plan.rate,
        rateInterval: plan.rateInterval,
        payoutStyle: plan.payoutStyle,
        status: "active",
        startedAt: now,
        endsAt: computeEndsAt(now, plan.durationDays),
        totalAccrued: 0,
        lastAccrualAt: now,
      });
      await ctx.db.insert("transactions", {
        userId: depositor._id,
        type: "investment",
        amount: deposit.amount,
        currency: deposit.currency,
        balanceBefore: balanceAfterDeposit,
        balanceAfter: balanceAfterInvestment,
        relatedId: investmentId,
        performedBy: admin._id,
        note: `Invested in ${plan.name}`,
        createdAt: now,
      });
      balanceAfter = balanceAfterInvestment;

      await ctx.scheduler.runAfter(0, internal.emails.sendInvestmentStarted, {
        userId: depositor._id,
        planName: plan.name,
        principal: deposit.amount,
        currency: deposit.currency,
        rate: plan.rate,
        rateInterval: plan.rateInterval,
        endsAt: computeEndsAt(now, plan.durationDays),
      });
    }

    await ctx.db.patch(depositor._id, {
      balances: { ...depositor.balances, [deposit.currency]: balanceAfter },
    });

    await logAdminAction(ctx, {
      adminId: admin._id,
      action: "approve_deposit",
      targetTable: "deposits",
      targetId: args.depositId,
      before: { status: "pending" },
      after: { status: "approved" },
    });

    await ctx.scheduler.runAfter(0, internal.emails.sendDepositApproved, {
      userId: depositor._id,
      amount: deposit.amount,
      currency: deposit.currency,
      newBalance: balanceAfter,
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
          totalCommissionEarned: {
            ...referral.totalCommissionEarned,
            [deposit.currency]: addMoney(
              referral.totalCommissionEarned[deposit.currency],
              commission,
            ),
          },
        });

        await ctx.scheduler.runAfter(0, internal.emails.sendReferralCommission, {
          userId: referrer._id,
          amount: commission,
          currency: deposit.currency,
          maskedReferredEmail: maskEmail(depositor.email),
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

    const reason = args.rejectionReason.trim();
    await ctx.db.patch(args.depositId, {
      status: "rejected",
      reviewedBy: admin._id,
      reviewedAt: Date.now(),
      rejectionReason: reason,
    });

    await logAdminAction(ctx, {
      adminId: admin._id,
      action: "reject_deposit",
      targetTable: "deposits",
      targetId: args.depositId,
      before: { status: "pending" },
      after: { status: "rejected", rejectionReason: reason },
    });

    await ctx.scheduler.runAfter(0, internal.emails.sendDepositRejected, {
      userId: deposit.userId,
      amount: deposit.amount,
      currency: deposit.currency,
      reason,
    });
  },
});
