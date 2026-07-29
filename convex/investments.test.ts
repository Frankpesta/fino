// @vitest-environment edge-runtime
import { describe, it, expect } from "vitest";
import { convexTest } from "convex-test";
import schema from "./schema";
import { api, internal } from "./_generated/api";
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

async function seedUserWithBalance(t: ReturnType<typeof convexTest>, usdt: number) {
  const userId = await t.run((ctx) =>
    ctx.db.insert(
      "users",
      baseUser({ balances: { BTC: 0, ETH: 0, USDT: usdt, USDC: 0, BNB: 0 } }),
    ),
  );
  return { userId, asUser: t.withIdentity({ subject: userId }) };
}

function basePlan(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    name: "Growth Plan",
    description: "Test plan",
    minDeposit: 100,
    currency: "USDT" as const,
    rate: 0.07, // 7%/week
    rateInterval: "weekly" as const,
    durationDays: 14,
    payoutStyle: "accrual" as const,
    isActive: true,
    sortOrder: 0,
    createdAt: Date.now(),
    ...overrides,
  };
}

async function seedPlan(
  t: ReturnType<typeof convexTest>,
  adminId: string,
  overrides: Partial<Record<string, unknown>> = {},
) {
  return await t.run((ctx) =>
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ctx.db.insert("investmentPlans", { ...basePlan(overrides), createdBy: adminId } as any),
  );
}

// Accrual/finalization logic never reads the plan itself (only the
// rate/rateInterval/payoutStyle already locked onto the investment row), but
// convex-test still validates that a `v.id("investmentPlans")` field holds
// an ID actually generated for that table, so a real (if otherwise unused)
// plan row is still required.
async function seedDummyPlanId(t: ReturnType<typeof convexTest>) {
  const adminId = await t.run((ctx) => ctx.db.insert("users", baseUser({ role: "admin" })));
  return await seedPlan(t, adminId);
}

async function seedInvestment(
  t: ReturnType<typeof convexTest>,
  fields: Record<string, unknown>,
) {
  return await t.run((ctx) =>
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ctx.db.insert("investments", fields as any),
  );
}

describe("investments.invest", () => {
  it("rejects an inactive plan", async () => {
    const t = convexTest(schema, modules);
    const adminId = await t.run((ctx) => ctx.db.insert("users", baseUser({ role: "admin" })));
    const { asUser } = await seedUserWithBalance(t, 1000);
    const planId = await seedPlan(t, adminId, { isActive: false });

    await expect(
      asUser.mutation(api.investments.invest, { planId, currency: "USDT", amount: 200 }),
    ).rejects.toThrow(/no longer active/i);
  });

  it("rejects a currency the plan doesn't accept", async () => {
    const t = convexTest(schema, modules);
    const adminId = await t.run((ctx) => ctx.db.insert("users", baseUser({ role: "admin" })));
    const { asUser } = await seedUserWithBalance(t, 1000);
    const planId = await seedPlan(t, adminId, { currency: "BTC" });

    await expect(
      asUser.mutation(api.investments.invest, { planId, currency: "USDT", amount: 200 }),
    ).rejects.toThrow(/only accepts BTC/i);
  });

  it("rejects an amount below minDeposit", async () => {
    const t = convexTest(schema, modules);
    const adminId = await t.run((ctx) => ctx.db.insert("users", baseUser({ role: "admin" })));
    const { asUser } = await seedUserWithBalance(t, 1000);
    const planId = await seedPlan(t, adminId, { minDeposit: 500 });

    await expect(
      asUser.mutation(api.investments.invest, { planId, currency: "USDT", amount: 200 }),
    ).rejects.toThrow(/minimum investment/i);
  });

  it("rejects an amount above maxDeposit", async () => {
    const t = convexTest(schema, modules);
    const adminId = await t.run((ctx) => ctx.db.insert("users", baseUser({ role: "admin" })));
    const { asUser } = await seedUserWithBalance(t, 10000);
    const planId = await seedPlan(t, adminId, { maxDeposit: 1000 });

    await expect(
      asUser.mutation(api.investments.invest, { planId, currency: "USDT", amount: 2000 }),
    ).rejects.toThrow(/maximum investment/i);
  });

  it("rejects an amount above available balance, respecting pending withdrawal holds", async () => {
    const t = convexTest(schema, modules);
    const adminId = await t.run((ctx) => ctx.db.insert("users", baseUser({ role: "admin" })));
    const { userId, asUser } = await seedUserWithBalance(t, 1000);
    const planId = await seedPlan(t, adminId, { minDeposit: 100 });
    await t.run((ctx) =>
      ctx.db.insert("withdrawals", {
        userId,
        amount: 800,
        currency: "USDT",
        destinationAddress: "addr",
        status: "pending",
        createdAt: Date.now(),
      }),
    );

    // Only 200 available (1000 - 800 held), investing 500 should fail.
    await expect(
      asUser.mutation(api.investments.invest, { planId, currency: "USDT", amount: 500 }),
    ).rejects.toThrow(/exceeds available balance/i);
  });

  it("locks rate/rateInterval/payoutStyle at investment time, decrements balance, and logs a ledger entry", async () => {
    const t = convexTest(schema, modules);
    const adminId = await t.run((ctx) => ctx.db.insert("users", baseUser({ role: "admin" })));
    const { userId, asUser } = await seedUserWithBalance(t, 1000);
    const planId = await seedPlan(t, adminId, { rate: 0.07, rateInterval: "weekly" });

    const investmentId = await asUser.mutation(api.investments.invest, {
      planId,
      currency: "USDT",
      amount: 500,
    });

    const investment = await t.run((ctx) => ctx.db.get(investmentId));
    expect(investment?.principal).toBe(500);
    expect(investment?.rate).toBe(0.07);
    expect(investment?.rateInterval).toBe("weekly");
    expect(investment?.payoutStyle).toBe("accrual");
    expect(investment?.status).toBe("active");
    expect(investment?.totalAccrued).toBe(0);

    const user = await t.run((ctx) => ctx.db.get(userId));
    expect(user?.balances.USDT).toBe(500);

    // Admin edits the plan's rate afterward -- the existing investment must
    // keep the rate it locked in at investment time.
    await t.run((ctx) => ctx.db.patch(planId, { rate: 0.5 }));
    const investmentAfterPlanEdit = await t.run((ctx) => ctx.db.get(investmentId));
    expect(investmentAfterPlanEdit?.rate).toBe(0.07);

    const txs = await t.run((ctx) =>
      ctx.db
        .query("transactions")
        .withIndex("by_userId", (q) => q.eq("userId", userId))
        .collect(),
    );
    const investmentTx = txs.find((tx) => tx.type === "investment");
    expect(investmentTx?.amount).toBe(500);
    expect(investmentTx?.balanceBefore).toBe(1000);
    expect(investmentTx?.balanceAfter).toBe(500);
    expect(investmentTx?.relatedId).toBe(investmentId);
  });
});

describe("investments.runDailyAccrual", () => {
  it("credits balance daily for payoutStyle 'accrual' and logs a transaction", async () => {
    const t = convexTest(schema, modules);
    const { userId } = await seedUserWithBalance(t, 500);
    const planId = await seedDummyPlanId(t);
    const investmentId = await seedInvestment(t, {
      userId,
      planId,
      principal: 1000,
      currency: "USDT",
      rate: 0.07,
      rateInterval: "weekly",
      payoutStyle: "accrual",
      status: "active",
      startedAt: Date.now() - ONE_DAY_MS,
      endsAt: Date.now() + 13 * ONE_DAY_MS,
      totalAccrued: 0,
      lastAccrualAt: Date.now() - ONE_DAY_MS,
    });

    await t.mutation(internal.investments.runDailyAccrual, {});

    const investment = await t.run((ctx) => ctx.db.get(investmentId));
    // 1000 * 0.07 / 7 = 10
    expect(investment?.totalAccrued).toBe(10);

    const user = await t.run((ctx) => ctx.db.get(userId));
    expect(user?.balances.USDT).toBe(510);

    const txs = await t.run((ctx) =>
      ctx.db
        .query("transactions")
        .withIndex("by_userId", (q) => q.eq("userId", userId))
        .collect(),
    );
    expect(txs).toHaveLength(1);
    expect(txs[0].type).toBe("payout");
    expect(txs[0].amount).toBe(10);
    expect(txs[0].relatedId).toBe(investmentId);
  });

  it("tracks totalAccrued for payoutStyle 'end_of_term' without touching balance or writing a transaction", async () => {
    const t = convexTest(schema, modules);
    const { userId } = await seedUserWithBalance(t, 500);
    const planId = await seedDummyPlanId(t);
    const investmentId = await seedInvestment(t, {
      userId,
      planId,
      principal: 1000,
      currency: "USDT",
      rate: 0.07,
      rateInterval: "weekly",
      payoutStyle: "end_of_term",
      status: "active",
      startedAt: Date.now() - ONE_DAY_MS,
      endsAt: Date.now() + 13 * ONE_DAY_MS,
      totalAccrued: 0,
      lastAccrualAt: Date.now() - ONE_DAY_MS,
    });

    await t.mutation(internal.investments.runDailyAccrual, {});

    const investment = await t.run((ctx) => ctx.db.get(investmentId));
    expect(investment?.totalAccrued).toBe(10);

    const user = await t.run((ctx) => ctx.db.get(userId));
    expect(user?.balances.USDT).toBe(500);

    const txs = await t.run((ctx) =>
      ctx.db
        .query("transactions")
        .withIndex("by_userId", (q) => q.eq("userId", userId))
        .collect(),
    );
    expect(txs).toHaveLength(0);
  });

  it("is idempotent: re-running immediately does not double-pay", async () => {
    const t = convexTest(schema, modules);
    const { userId } = await seedUserWithBalance(t, 500);
    const planId = await seedDummyPlanId(t);
    const investmentId = await seedInvestment(t, {
      userId,
      planId,
      principal: 1000,
      currency: "USDT",
      rate: 0.07,
      rateInterval: "weekly",
      payoutStyle: "accrual",
      status: "active",
      startedAt: Date.now() - ONE_DAY_MS,
      endsAt: Date.now() + 13 * ONE_DAY_MS,
      totalAccrued: 0,
      lastAccrualAt: Date.now() - ONE_DAY_MS,
    });

    await t.mutation(internal.investments.runDailyAccrual, {});
    await t.mutation(internal.investments.runDailyAccrual, {});

    const investment = await t.run((ctx) => ctx.db.get(investmentId));
    expect(investment?.totalAccrued).toBe(10);

    const user = await t.run((ctx) => ctx.db.get(userId));
    expect(user?.balances.USDT).toBe(510);
  });

  it("skips investments that aren't due yet", async () => {
    const t = convexTest(schema, modules);
    const { userId } = await seedUserWithBalance(t, 500);
    const planId = await seedDummyPlanId(t);
    const investmentId = await seedInvestment(t, {
      userId,
      planId,
      principal: 1000,
      currency: "USDT",
      rate: 0.07,
      rateInterval: "weekly",
      payoutStyle: "accrual",
      status: "active",
      startedAt: Date.now(),
      endsAt: Date.now() + 14 * ONE_DAY_MS,
      totalAccrued: 0,
      lastAccrualAt: Date.now(), // accrued moments ago
    });

    await t.mutation(internal.investments.runDailyAccrual, {});

    const investment = await t.run((ctx) => ctx.db.get(investmentId));
    expect(investment?.totalAccrued).toBe(0);
  });

  it("ignores non-active investments", async () => {
    const t = convexTest(schema, modules);
    const { userId } = await seedUserWithBalance(t, 500);
    const planId = await seedDummyPlanId(t);
    const investmentId = await seedInvestment(t, {
      userId,
      planId,
      principal: 1000,
      currency: "USDT",
      rate: 0.07,
      rateInterval: "weekly",
      payoutStyle: "accrual",
      status: "completed",
      startedAt: Date.now() - 20 * ONE_DAY_MS,
      endsAt: Date.now() - 6 * ONE_DAY_MS,
      totalAccrued: 60,
      lastAccrualAt: Date.now() - 6 * ONE_DAY_MS,
    });

    await t.mutation(internal.investments.runDailyAccrual, {});

    const investment = await t.run((ctx) => ctx.db.get(investmentId));
    expect(investment?.totalAccrued).toBe(60);
  });
});

describe("investments.runFinalizeSweep", () => {
  it("returns only principal for payoutStyle 'accrual' (interest already paid daily)", async () => {
    const t = convexTest(schema, modules);
    const { userId } = await seedUserWithBalance(t, 500);
    const planId = await seedDummyPlanId(t);
    const investmentId = await seedInvestment(t, {
      userId,
      planId,
      principal: 1000,
      currency: "USDT",
      rate: 0.07,
      rateInterval: "weekly",
      payoutStyle: "accrual",
      status: "active",
      startedAt: Date.now() - 14 * ONE_DAY_MS,
      endsAt: Date.now() - 1,
      totalAccrued: 140,
      lastAccrualAt: Date.now() - ONE_DAY_MS,
    });

    await t.mutation(internal.investments.runFinalizeSweep, {});

    const investment = await t.run((ctx) => ctx.db.get(investmentId));
    expect(investment?.status).toBe("completed");

    const user = await t.run((ctx) => ctx.db.get(userId));
    expect(user?.balances.USDT).toBe(1500); // 500 + 1000 principal only

    const txs = await t.run((ctx) =>
      ctx.db
        .query("transactions")
        .withIndex("by_userId", (q) => q.eq("userId", userId))
        .collect(),
    );
    expect(txs).toHaveLength(1);
    expect(txs[0].amount).toBe(1000);
  });

  it("returns principal + totalAccrued in one lump sum for payoutStyle 'end_of_term'", async () => {
    const t = convexTest(schema, modules);
    const { userId } = await seedUserWithBalance(t, 500);
    const planId = await seedDummyPlanId(t);
    const investmentId = await seedInvestment(t, {
      userId,
      planId,
      principal: 1000,
      currency: "USDT",
      rate: 0.07,
      rateInterval: "weekly",
      payoutStyle: "end_of_term",
      status: "active",
      startedAt: Date.now() - 14 * ONE_DAY_MS,
      endsAt: Date.now() - 1,
      totalAccrued: 140,
      lastAccrualAt: Date.now() - ONE_DAY_MS,
    });

    await t.mutation(internal.investments.runFinalizeSweep, {});

    const investment = await t.run((ctx) => ctx.db.get(investmentId));
    expect(investment?.status).toBe("completed");

    const user = await t.run((ctx) => ctx.db.get(userId));
    expect(user?.balances.USDT).toBe(1640); // 500 + 1000 + 140

    const txs = await t.run((ctx) =>
      ctx.db
        .query("transactions")
        .withIndex("by_userId", (q) => q.eq("userId", userId))
        .collect(),
    );
    expect(txs).toHaveLength(1);
    expect(txs[0].amount).toBe(1140);
  });

  it("does not touch investments whose term hasn't ended", async () => {
    const t = convexTest(schema, modules);
    const { userId } = await seedUserWithBalance(t, 500);
    const planId = await seedDummyPlanId(t);
    const investmentId = await seedInvestment(t, {
      userId,
      planId,
      principal: 1000,
      currency: "USDT",
      rate: 0.07,
      rateInterval: "weekly",
      payoutStyle: "accrual",
      status: "active",
      startedAt: Date.now(),
      endsAt: Date.now() + 14 * ONE_DAY_MS,
      totalAccrued: 0,
      lastAccrualAt: Date.now(),
    });

    await t.mutation(internal.investments.runFinalizeSweep, {});

    const investment = await t.run((ctx) => ctx.db.get(investmentId));
    expect(investment?.status).toBe("active");

    const user = await t.run((ctx) => ctx.db.get(userId));
    expect(user?.balances.USDT).toBe(500);
  });

  it("is idempotent: re-running does not re-pay an already-completed investment", async () => {
    const t = convexTest(schema, modules);
    const { userId } = await seedUserWithBalance(t, 500);
    const planId = await seedDummyPlanId(t);
    await seedInvestment(t, {
      userId,
      planId,
      principal: 1000,
      currency: "USDT",
      rate: 0.07,
      rateInterval: "weekly",
      payoutStyle: "accrual",
      status: "active",
      startedAt: Date.now() - 14 * ONE_DAY_MS,
      endsAt: Date.now() - 1,
      totalAccrued: 140,
      lastAccrualAt: Date.now() - ONE_DAY_MS,
    });

    await t.mutation(internal.investments.runFinalizeSweep, {});
    await t.mutation(internal.investments.runFinalizeSweep, {});

    const user = await t.run((ctx) => ctx.db.get(userId));
    expect(user?.balances.USDT).toBe(1500);
  });
});
