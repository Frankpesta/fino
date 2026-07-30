import { query } from "./_generated/server";
import { v } from "convex/values";
import { requireVerifiedUser } from "./model/authz";
import { getAllCachedUsdRates } from "./model/exchangeRates";
import { addMoney, round8 } from "../lib/money";
import { CURRENCIES, type Currency } from "../lib/currency";

function zeroByCurrency(): Record<Currency, number> {
  return { BTC: 0, ETH: 0, USDT: 0, USDC: 0, BNB: 0 };
}

// Every per-currency figure below stays exact, straight from the ledger
// tables -- no client-side "estimated" math. The `*Usd` companion figures
// are a single-number convenience for the dashboard cards, converted at
// read time from the cached rate cron (see convex/exchangeRates.ts); they're
// a display estimate, not what's actually stored or moved anywhere.
function sumUsd(byCurrency: Record<Currency, number>, rates: Partial<Record<Currency, number>>) {
  let total = 0;
  for (const currency of CURRENCIES) {
    total += byCurrency[currency] * (rates[currency] ?? 0);
  }
  return round8(total);
}

export const getStats = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireVerifiedUser(ctx);

    const [
      activeInvestments,
      payoutTransactions,
      pendingDeposits,
      pendingWithdrawals,
      approvedDeposits,
      approvedWithdrawals,
      referrals,
    ] = await Promise.all([
      ctx.db
        .query("investments")
        .withIndex("by_userId", (q) => q.eq("userId", user._id))
        .filter((q) => q.eq(q.field("status"), "active"))
        .collect(),
      ctx.db
        .query("transactions")
        .withIndex("by_userId", (q) => q.eq("userId", user._id))
        .filter((q) => q.eq(q.field("type"), "payout"))
        .collect(),
      ctx.db
        .query("deposits")
        .withIndex("by_userId", (q) => q.eq("userId", user._id))
        .filter((q) => q.eq(q.field("status"), "pending"))
        .collect(),
      ctx.db
        .query("withdrawals")
        .withIndex("by_userId", (q) => q.eq("userId", user._id))
        .filter((q) => q.eq(q.field("status"), "pending"))
        .collect(),
      ctx.db
        .query("deposits")
        .withIndex("by_userId", (q) => q.eq("userId", user._id))
        .filter((q) => q.eq(q.field("status"), "approved"))
        .collect(),
      ctx.db
        .query("withdrawals")
        .withIndex("by_userId", (q) => q.eq("userId", user._id))
        .filter((q) => q.eq(q.field("status"), "approved"))
        .collect(),
      ctx.db
        .query("referrals")
        .withIndex("by_referrerId", (q) => q.eq("referrerId", user._id))
        .collect(),
    ]);

    const activeInvestmentPrincipal = zeroByCurrency();
    for (const inv of activeInvestments) {
      activeInvestmentPrincipal[inv.currency] = addMoney(
        activeInvestmentPrincipal[inv.currency],
        inv.principal,
      );
    }

    const totalEarned = zeroByCurrency();
    for (const tx of payoutTransactions) {
      const currency = tx.currency as Currency;
      if (CURRENCIES.includes(currency)) {
        totalEarned[currency] = addMoney(totalEarned[currency], tx.amount);
      }
    }

    const totalApprovedDeposits = zeroByCurrency();
    for (const deposit of approvedDeposits) {
      totalApprovedDeposits[deposit.currency] = addMoney(
        totalApprovedDeposits[deposit.currency],
        deposit.amount,
      );
    }

    const totalApprovedWithdrawals = zeroByCurrency();
    for (const withdrawal of approvedWithdrawals) {
      totalApprovedWithdrawals[withdrawal.currency] = addMoney(
        totalApprovedWithdrawals[withdrawal.currency],
        withdrawal.amount,
      );
    }

    const totalReferralCommission = zeroByCurrency();
    for (const referral of referrals) {
      for (const currency of CURRENCIES) {
        totalReferralCommission[currency] = addMoney(
          totalReferralCommission[currency],
          referral.totalCommissionEarned[currency],
        );
      }
    }

    const rates = await getAllCachedUsdRates(ctx);

    return {
      balances: user.balances,
      activeInvestmentCount: activeInvestments.length,
      activeInvestmentPrincipal,
      totalEarned,
      totalApprovedDeposits,
      totalApprovedWithdrawals,
      totalReferralCommission,
      pendingDepositCount: pendingDeposits.length,
      pendingWithdrawalCount: pendingWithdrawals.length,
      balancesUsd: sumUsd(user.balances, rates),
      activeInvestmentPrincipalUsd: sumUsd(activeInvestmentPrincipal, rates),
      totalEarnedUsd: sumUsd(totalEarned, rates),
      totalApprovedDepositsUsd: sumUsd(totalApprovedDeposits, rates),
      totalApprovedWithdrawalsUsd: sumUsd(totalApprovedWithdrawals, rates),
      totalReferralCommissionUsd: sumUsd(totalReferralCommission, rates),
    };
  },
});

// A bounded, ledger-backed view for the client chart. `now` is supplied by the
// client instead of reading the wall clock in a query, keeping this reactive
// query cacheable while still giving the UI an honest rolling 30-day window.
export const getTrend = query({
  args: { now: v.number() },
  handler: async (ctx, args) => {
    const user = await requireVerifiedUser(ctx);
    const start = args.now - 30 * 24 * 60 * 60 * 1000;
    const [transactions, rates] = await Promise.all([
      ctx.db
        .query("transactions")
        .withIndex("by_userId_and_createdAt", (q) =>
          q.eq("userId", user._id).gte("createdAt", start),
        )
        .order("asc")
        .take(500),
      getAllCachedUsdRates(ctx),
    ]);

    const days = Array.from({ length: 30 }, (_, offset) => {
      const date = new Date(start + offset * 24 * 60 * 60 * 1000);
      return {
        date: date.toISOString().slice(0, 10),
        label: date.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        inflow: 0,
        outflow: 0,
      };
    });
    const byDate = new Map(days.map((day) => [day.date, day]));
    for (const tx of transactions) {
      const day = byDate.get(new Date(tx.createdAt).toISOString().slice(0, 10));
      if (!day) continue;
      const usd = tx.amount * (rates[tx.currency as Currency] ?? 0);
      if (tx.type === "withdrawal" || tx.type === "investment") day.outflow += usd;
      else day.inflow += usd;
    }
    return days.map((day) => ({
      ...day,
      inflow: round8(day.inflow),
      outflow: round8(day.outflow),
      net: round8(day.inflow - day.outflow),
    }));
  },
});
