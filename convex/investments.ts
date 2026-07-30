import { v } from "convex/values";
import { mutation, query, internalMutation } from "./_generated/server";
import { internal } from "./_generated/api";
import { requireVerifiedUser } from "./model/authz";
import { getAvailableBalance } from "./model/balances";
import { getCachedUsdRate } from "./model/exchangeRates";
import { currencyValidator } from "./schema";
import { addMoney, applyDelta, multiplyMoney } from "../lib/money";
import { computeEndsAt, dailyAccrualAmount, isAccrualDue } from "../lib/investmentMath";

export const listMine = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireVerifiedUser(ctx);
    return await ctx.db
      .query("investments")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .order("desc")
      .collect();
  },
});

export const getById = query({
  args: { investmentId: v.id("investments") },
  handler: async (ctx, args) => {
    const user = await requireVerifiedUser(ctx);
    const investment = await ctx.db.get(args.investmentId);
    if (!investment || investment.userId !== user._id) {
      throw new Error("Investment not found");
    }
    const plan = await ctx.db.get(investment.planId);

    const accrualHistory = (
      await ctx.db
        .query("transactions")
        .withIndex("by_userId", (q) => q.eq("userId", user._id))
        .filter((q) => q.eq(q.field("relatedId"), args.investmentId))
        .collect()
    ).sort((a, b) => b.createdAt - a.createdAt);

    return { investment, plan, accrualHistory };
  },
});

// Investing is user-initiated and immediate (unlike deposits/withdrawals,
// which need admin approval) -- it just moves a user's own already-approved
// balance into a plan, no external money movement happens. Rate,
// rateInterval, and payoutStyle are copied from the plan onto the investment
// row and never change afterward even if the admin edits the plan later
// (docs/04-phase-3-investment-plans.md 3.4: "recommend locking rate at
// investment time for trust/audit reasons").
export const invest = mutation({
  args: {
    planId: v.id("investmentPlans"),
    currency: currencyValidator,
    amount: v.number(),
  },
  handler: async (ctx, args) => {
    const user = await requireVerifiedUser(ctx);

    if (!Number.isFinite(args.amount) || args.amount <= 0) {
      throw new Error("Amount must be greater than zero");
    }

    const plan = await ctx.db.get(args.planId);
    if (!plan || !plan.isActive) {
      throw new Error("Plan not found or no longer active");
    }
    if (plan.currency !== "ANY" && plan.currency !== args.currency) {
      throw new Error(`This plan only accepts ${plan.currency}`);
    }

    // Plan tiers are USD-denominated (see lib/planMatching.ts) -- converting
    // the chosen native-currency amount through the live cached rate keeps
    // this manual "invest already-available balance" path consistent with
    // deposit-time plan matching, even though this path never touches USD
    // for the actual balance/investment amounts themselves.
    const rate = await getCachedUsdRate(ctx, args.currency);
    if (rate <= 0) {
      throw new Error("Live pricing isn't available for this currency right now -- try again shortly");
    }
    const amountUsd = multiplyMoney(args.amount, rate);
    if (amountUsd < plan.minDepositUsd) {
      throw new Error(`Minimum investment for this plan is $${plan.minDepositUsd}`);
    }
    if (plan.maxDepositUsd !== undefined && amountUsd > plan.maxDepositUsd) {
      throw new Error(`Maximum investment for this plan is $${plan.maxDepositUsd}`);
    }

    // Respects the same withdrawal hold as convex/withdrawals.ts -- a user
    // can't invest funds they've already requested to withdraw.
    const available = await getAvailableBalance(ctx, user, args.currency);
    if (args.amount > available) {
      throw new Error(
        `Amount exceeds available balance (${available} ${args.currency} available)`,
      );
    }

    const balanceBefore = user.balances[args.currency];
    const balanceAfter = applyDelta(balanceBefore, -args.amount);
    await ctx.db.patch(user._id, {
      balances: { ...user.balances, [args.currency]: balanceAfter },
    });

    const now = Date.now();
    const investmentId = await ctx.db.insert("investments", {
      userId: user._id,
      planId: plan._id,
      principal: args.amount,
      currency: args.currency,
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
      userId: user._id,
      type: "investment",
      amount: args.amount,
      currency: args.currency,
      balanceBefore,
      balanceAfter,
      relatedId: investmentId,
      performedBy: user._id,
      note: `Invested in ${plan.name}`,
      createdAt: now,
    });

    await ctx.scheduler.runAfter(0, internal.emails.sendInvestmentStarted, {
      userId: user._id,
      planName: plan.name,
      principal: args.amount,
      currency: args.currency,
      rate: plan.rate,
      rateInterval: plan.rateInterval,
      endsAt: computeEndsAt(now, plan.durationDays),
    });

    return investmentId;
  },
});

// --- Accrual + finalization crons (see convex/crons.ts for schedule) ---
//
// Every active investment accrues once per day, pro-rated from its locked
// rate/rateInterval regardless of the plan's stated interval ("daily
// pro-rated ticking" -- see lib/investmentMath.ts). `isAccrualDue` guards
// against double-paying if the cron re-triggers within the same day.
//
// `payoutStyle: "accrual"` credits each day's amount straight to the user's
// balance and logs a `transactions` row (a real balance change). `"end_of_term"`
// only tracks `totalAccrued` on the investment day-to-day -- no balance
// change happens, so no `transactions` row is written (that table is the
// audit trail for balance-affecting events specifically; see
// docs/01-data-model.md "Design notes"). The full accrued amount is paid out
// in one transaction at finalization instead.
//
// `performedBy` on these system-generated transactions is the investment
// owner's own userId -- the schema has no dedicated "system" account, and
// docs/01-data-model.md's `transactions.performedBy` comment ("system,
// admin, or the user themself") treats that as an acceptable stand-in.
export const runDailyAccrual = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const activeInvestments = await ctx.db
      .query("investments")
      .withIndex("by_status", (q) => q.eq("status", "active"))
      .collect();

    // Each investment is isolated in its own try/catch so one bad record
    // (e.g. a dangling userId) can't silently abort accrual for every other
    // active investment in the same run -- a partial run is recoverable next
    // tick, a fully-skipped run is a direct financial discrepancy across the
    // whole book. Failures are collected and alert admins below.
    const errors: string[] = [];
    for (const investment of activeInvestments) {
      try {
        if (!isAccrualDue(investment.lastAccrualAt, now)) continue;

        const amount = dailyAccrualAmount(
          investment.principal,
          investment.rate,
          investment.rateInterval,
        );
        const newTotalAccrued = addMoney(investment.totalAccrued, amount);

        if (investment.payoutStyle === "accrual") {
          const user = await ctx.db.get(investment.userId);
          if (!user) continue;
          const balanceBefore = user.balances[investment.currency];
          const balanceAfter = applyDelta(balanceBefore, amount);
          await ctx.db.patch(user._id, {
            balances: { ...user.balances, [investment.currency]: balanceAfter },
          });
          await ctx.db.insert("transactions", {
            userId: user._id,
            type: "payout",
            amount,
            currency: investment.currency,
            balanceBefore,
            balanceAfter,
            relatedId: investment._id,
            performedBy: user._id,
            note: "Daily accrual",
            createdAt: now,
          });
        }

        await ctx.db.patch(investment._id, {
          totalAccrued: newTotalAccrued,
          lastAccrualAt: now,
        });
      } catch (err) {
        errors.push(
          `investment ${investment._id}: ${err instanceof Error ? err.message : String(err)}`,
        );
      }
    }

    if (errors.length > 0) {
      await ctx.scheduler.runAfter(0, internal.emails.sendCronFailureAlert, {
        cronName: "runDailyAccrual",
        errorCount: errors.length,
        firstError: errors[0],
      });
    }
  },
});

export const runFinalizeSweep = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const dueInvestments = (
      await ctx.db
        .query("investments")
        .withIndex("by_endsAt", (q) => q.lte("endsAt", now))
        .collect()
    ).filter((inv) => inv.status === "active");

    // Same per-record isolation as runDailyAccrual above -- one investment
    // failing to finalize must not block principal/payout return for every
    // other investment due this run.
    const errors: string[] = [];
    for (const investment of dueInvestments) {
      try {
        const user = await ctx.db.get(investment.userId);
        if (!user) continue;

        // "accrual" style already paid out interest day-to-day, so only the
        // principal is returned. "end_of_term" pays principal + everything
        // accrued in one lump sum now.
        const payoutAmount =
          investment.payoutStyle === "end_of_term"
            ? addMoney(investment.principal, investment.totalAccrued)
            : investment.principal;

        const balanceBefore = user.balances[investment.currency];
        const balanceAfter = applyDelta(balanceBefore, payoutAmount);
        await ctx.db.patch(user._id, {
          balances: { ...user.balances, [investment.currency]: balanceAfter },
        });
        await ctx.db.insert("transactions", {
          userId: user._id,
          type: "payout",
          amount: payoutAmount,
          currency: investment.currency,
          balanceBefore,
          balanceAfter,
          relatedId: investment._id,
          performedBy: user._id,
          note:
            investment.payoutStyle === "end_of_term"
              ? "End-of-term payout (principal + accrued)"
              : "Principal returned at term end",
          createdAt: now,
        });

        await ctx.db.patch(investment._id, { status: "completed" });

        const plan = await ctx.db.get(investment.planId);
        await ctx.scheduler.runAfter(0, internal.emails.sendInvestmentMatured, {
          userId: user._id,
          planName: plan?.name ?? "your plan",
          payoutAmount,
          currency: investment.currency,
        });
      } catch (err) {
        errors.push(
          `investment ${investment._id}: ${err instanceof Error ? err.message : String(err)}`,
        );
      }
    }

    if (errors.length > 0) {
      await ctx.scheduler.runAfter(0, internal.emails.sendCronFailureAlert, {
        cronName: "runFinalizeSweep",
        errorCount: errors.length,
        firstError: errors[0],
      });
    }
  },
});
