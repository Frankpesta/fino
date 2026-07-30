import { v } from "convex/values";
import { query } from "./_generated/server";
import { requireAdmin } from "./model/authz";
import { addMoney, round8 } from "../lib/money";
import { getAllCachedUsdRates } from "./model/exchangeRates";
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

// Platform-wide, 30-day rollup for the admin dashboard charts: approved
// deposit/withdrawal USD flow (converted at today's cached rate, same
// display-estimate convention as convex/dashboard.ts) plus daily signups.
export const getTrend = query({
  args: { now: v.number() },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const start = args.now - 30 * 24 * 60 * 60 * 1000;

    const [deposits, withdrawals, users, rates] = await Promise.all([
      ctx.db
        .query("deposits")
        .withIndex("by_status", (q) => q.eq("status", "approved"))
        .collect(),
      ctx.db
        .query("withdrawals")
        .withIndex("by_status", (q) => q.eq("status", "approved"))
        .collect(),
      ctx.db.query("users").collect(),
      getAllCachedUsdRates(ctx),
    ]);

    const days = Array.from({ length: 30 }, (_, offset) => {
      const date = new Date(start + offset * 24 * 60 * 60 * 1000);
      return {
        date: date.toISOString().slice(0, 10),
        label: date.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        inflow: 0,
        outflow: 0,
        newUsers: 0,
      };
    });
    const byDate = new Map(days.map((day) => [day.date, day]));

    for (const deposit of deposits) {
      if (deposit.createdAt < start) continue;
      const day = byDate.get(new Date(deposit.createdAt).toISOString().slice(0, 10));
      if (!day) continue;
      day.inflow += deposit.amount * (rates[deposit.currency] ?? 0);
    }
    for (const withdrawal of withdrawals) {
      if (withdrawal.createdAt < start) continue;
      const day = byDate.get(new Date(withdrawal.createdAt).toISOString().slice(0, 10));
      if (!day) continue;
      day.outflow += withdrawal.amount * (rates[withdrawal.currency] ?? 0);
    }
    for (const user of users) {
      if (user.createdAt < start) continue;
      const day = byDate.get(new Date(user.createdAt).toISOString().slice(0, 10));
      if (!day) continue;
      day.newUsers += 1;
    }

    return days.map((day) => ({
      ...day,
      inflow: round8(day.inflow),
      outflow: round8(day.outflow),
    }));
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
