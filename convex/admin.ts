import { v } from "convex/values";
import { query } from "./_generated/server";
import { requireAdmin } from "./model/authz";
import { addMoney } from "../lib/money";
import { CURRENCIES, type Currency } from "../lib/currency";

function zeroByCurrency(): Record<Currency, number> {
  return { BTC: 0, ETH: 0, USDT: 0, USDC: 0, BNB: 0 };
}

function sumByCurrency<T extends { currency: string; amount: number }>(rows: T[]) {
  const totals = zeroByCurrency();
  for (const row of rows) {
    const currency = row.currency as Currency;
    if (CURRENCIES.includes(currency)) {
      totals[currency] = addMoney(totals[currency], row.amount);
    }
  }
  return totals;
}

// Platform-wide, per-asset (no fabricated cross-currency total -- same
// reasoning as convex/dashboard.ts: there's no price oracle in this build).
export const getStats = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);

    const [users, deposits, withdrawals, activeInvestments] = await Promise.all([
      ctx.db.query("users").collect(),
      ctx.db.query("deposits").collect(),
      ctx.db.query("withdrawals").collect(),
      ctx.db
        .query("investments")
        .withIndex("by_status", (q) => q.eq("status", "active"))
        .collect(),
    ]);

    const approvedDeposits = deposits.filter((d) => d.status === "approved");
    const pendingDeposits = deposits.filter((d) => d.status === "pending");
    const approvedWithdrawals = withdrawals.filter((w) => w.status === "approved");
    const pendingWithdrawals = withdrawals.filter((w) => w.status === "pending");

    return {
      totalUsers: users.length,
      totalDepositedAllTime: sumByCurrency(approvedDeposits),
      totalDepositedPending: sumByCurrency(pendingDeposits),
      totalWithdrawn: sumByCurrency(approvedWithdrawals),
      totalInvested: sumByCurrency(
        activeInvestments.map((i) => ({ currency: i.currency, amount: i.principal })),
      ),
      pendingDepositCount: pendingDeposits.length,
      pendingWithdrawalCount: pendingWithdrawals.length,
    };
  },
});

export const listAuditLog = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const entries = await ctx.db
      .query("adminAuditLog")
      .order("desc")
      .take(args.limit ?? 20);

    return await Promise.all(
      entries.map(async (entry) => {
        const admin = await ctx.db.get(entry.adminId);
        return { ...entry, adminEmail: admin?.email ?? "unknown" };
      }),
    );
  },
});
