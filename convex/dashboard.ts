import { query } from "./_generated/server";
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
