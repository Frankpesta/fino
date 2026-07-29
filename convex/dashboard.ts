import { query } from "./_generated/server";
import { requireVerifiedUser } from "./model/authz";
import { addMoney } from "../lib/money";
import { CURRENCIES, type Currency } from "../lib/currency";

function zeroByCurrency(): Record<Currency, number> {
  return { BTC: 0, ETH: 0, USDT: 0, USDC: 0, BNB: 0 };
}

// Deliberately no single summed "total balance" across assets -- there's no
// price oracle in this build, so 1 BTC + 1 USDT has no honest single number.
// Every figure here is per-asset, straight from the ledger tables, no
// client-side "estimated" math (see docs/03-phase-2-user-dashboard.md 2.1).
export const getStats = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireVerifiedUser(ctx);

    const [activeInvestments, payoutTransactions, pendingDeposits, pendingWithdrawals] =
      await Promise.all([
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

    return {
      balances: user.balances,
      activeInvestmentCount: activeInvestments.length,
      activeInvestmentPrincipal,
      totalEarned,
      pendingDepositCount: pendingDeposits.length,
      pendingWithdrawalCount: pendingWithdrawals.length,
    };
  },
});
