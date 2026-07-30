// @vitest-environment edge-runtime
import { describe, it, expect } from "vitest";
import { convexTest, type TestConvex } from "convex-test";
import schema from "./schema";
import { api } from "./_generated/api";
import { ONE_DAY_MS } from "../lib/investmentMath";

const modules = import.meta.glob("./**/*.ts");

function baseUser(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    email: "user@example.com",
    emailVerified: true,
    role: "user" as const,
    status: "active" as const,
    referralCode: "ABCDEFGH",
    balances: { BTC: 0, ETH: 0, USDT: 0, USDC: 0, BNB: 0 },
    twoFactorEnabled: false,
    createdAt: Date.now(),
    lastLoginAt: Date.now(),
    ...overrides,
  };
}

async function seedUserWithBalance(t: TestConvex<typeof schema>, usdt: number) {
  const userId = await t.run((ctx) =>
    ctx.db.insert("users", baseUser({ balances: { BTC: 0, ETH: 0, USDT: usdt, USDC: 0, BNB: 0 } })),
  );
  return { userId, asUser: t.withIdentity({ subject: userId }) };
}

describe("dashboard.getStats", () => {
  it("sums only approved deposits and withdrawals, ignoring pending/rejected", async () => {
    const t = convexTest(schema, modules);
    const { userId, asUser } = await seedUserWithBalance(t, 0);

    await t.run((ctx) =>
      ctx.db.insert("deposits", {
        userId,
        amount: 100,
        currency: "USDT",
        amountUsd: 100,
        quotedRate: 1,
        destinationWalletAddress: "addr",
        status: "approved",
        createdAt: Date.now(),
      }),
    );
    await t.run((ctx) =>
      ctx.db.insert("deposits", {
        userId,
        amount: 999,
        currency: "USDT",
        amountUsd: 999,
        quotedRate: 1,
        destinationWalletAddress: "addr",
        status: "pending",
        createdAt: Date.now(),
      }),
    );
    await t.run((ctx) =>
      ctx.db.insert("withdrawals", {
        userId,
        amount: 40,
        currency: "USDT",
        destinationAddress: "addr",
        status: "approved",
        createdAt: Date.now(),
      }),
    );
    await t.run((ctx) =>
      ctx.db.insert("withdrawals", {
        userId,
        amount: 500,
        currency: "USDT",
        destinationAddress: "addr",
        status: "rejected",
        createdAt: Date.now(),
      }),
    );

    const stats = await asUser.query(api.dashboard.getStats, {});
    expect(stats.totalApprovedDeposits.USDT).toBe(100);
    expect(stats.totalApprovedWithdrawals.USDT).toBe(40);
  });

  it("sums referral commission across all of a user's referrals", async () => {
    const t = convexTest(schema, modules);
    const { userId, asUser } = await seedUserWithBalance(t, 0);
    const referred1 = await t.run((ctx) => ctx.db.insert("users", baseUser({ email: "a@example.com" })));
    const referred2 = await t.run((ctx) => ctx.db.insert("users", baseUser({ email: "b@example.com" })));

    await t.run((ctx) =>
      ctx.db.insert("referrals", {
        referrerId: userId,
        referredUserId: referred1,
        commissionRate: 0.1,
        totalCommissionEarned: { BTC: 0, ETH: 0, USDT: 10, USDC: 0, BNB: 0 },
        createdAt: Date.now(),
      }),
    );
    await t.run((ctx) =>
      ctx.db.insert("referrals", {
        referrerId: userId,
        referredUserId: referred2,
        commissionRate: 0.1,
        totalCommissionEarned: { BTC: 0, ETH: 0, USDT: 5, USDC: 0, BNB: 0 },
        createdAt: Date.now(),
      }),
    );

    const stats = await asUser.query(api.dashboard.getStats, {});
    expect(stats.totalReferralCommission.USDT).toBe(15);
  });

  it("sums payout transactions as total earned", async () => {
    const t = convexTest(schema, modules);
    const { userId, asUser } = await seedUserWithBalance(t, 0);

    await t.run((ctx) =>
      ctx.db.insert("transactions", {
        userId,
        type: "payout",
        amount: 12.5,
        currency: "USDT",
        balanceBefore: 0,
        balanceAfter: 12.5,
        performedBy: userId,
        createdAt: Date.now(),
      }),
    );
    await t.run((ctx) =>
      ctx.db.insert("transactions", {
        userId,
        type: "investment",
        amount: 1000,
        currency: "USDT",
        balanceBefore: 1000,
        balanceAfter: 0,
        performedBy: userId,
        createdAt: Date.now(),
      }),
    );

    const stats = await asUser.query(api.dashboard.getStats, {});
    expect(stats.totalEarned.USDT).toBe(12.5);
  });

  it("reports active investment count and principal, ignoring completed investments", async () => {
    const t = convexTest(schema, modules);
    const { userId, asUser } = await seedUserWithBalance(t, 0);
    const adminId = await t.run((ctx) => ctx.db.insert("users", baseUser({ role: "admin" })));
    const planId = await t.run((ctx) =>
      ctx.db.insert("investmentPlans", {
        name: "Plan",
        description: "d",
        minDepositUsd: 1,
        currency: "USDT",
        rate: 0.07,
        rateInterval: "weekly",
        durationDays: 14,
        payoutStyle: "accrual",
        isActive: true,
        sortOrder: 0,
        createdBy: adminId,
        createdAt: Date.now(),
      }),
    );

    await t.run((ctx) =>
      ctx.db.insert("investments", {
        userId,
        planId,
        principal: 500,
        currency: "USDT",
        rate: 0.07,
        rateInterval: "weekly",
        payoutStyle: "accrual",
        status: "active",
        startedAt: Date.now(),
        endsAt: Date.now() + 14 * ONE_DAY_MS,
        totalAccrued: 0,
        lastAccrualAt: Date.now(),
      }),
    );
    await t.run((ctx) =>
      ctx.db.insert("investments", {
        userId,
        planId,
        principal: 200,
        currency: "USDT",
        rate: 0.07,
        rateInterval: "weekly",
        payoutStyle: "accrual",
        status: "completed",
        startedAt: Date.now() - 20 * ONE_DAY_MS,
        endsAt: Date.now() - 6 * ONE_DAY_MS,
        totalAccrued: 14,
        lastAccrualAt: Date.now() - 6 * ONE_DAY_MS,
      }),
    );

    const stats = await asUser.query(api.dashboard.getStats, {});
    expect(stats.activeInvestmentCount).toBe(1);
    expect(stats.activeInvestmentPrincipal.USDT).toBe(500);
  });
});
