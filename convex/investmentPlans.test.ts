// @vitest-environment edge-runtime
import { describe, it, expect } from "vitest";
import { convexTest } from "convex-test";
import schema from "./schema";
import { api } from "./_generated/api";

const modules = import.meta.glob("./**/*.ts");

function baseUser(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    email: "admin@example.com",
    emailVerified: true,
    role: "admin" as const,
    status: "active" as const,
    referralCode: "ABCDEFGH",
    balances: { BTC: 0, ETH: 0, USDT: 0, USDC: 0, BNB: 0 },
    twoFactorEnabled: false,
    createdAt: Date.now(),
    lastLoginAt: Date.now(),
    ...overrides,
  };
}

function basePlan(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    name: "Growth Plan",
    description: "Test plan",
    minDepositUsd: 100,
    currency: "USDT" as const,
    rate: 0.07,
    rateInterval: "weekly" as const,
    durationDays: 14,
    payoutStyle: "accrual" as const,
    isActive: true,
    sortOrder: 0,
    createdAt: Date.now(),
    ...overrides,
  };
}

describe("investmentPlans.listPublic", () => {
  it("returns active plans without requiring authentication", async () => {
    const t = convexTest(schema, modules);
    const adminId = await t.run((ctx) => ctx.db.insert("users", baseUser()));
    await t.run((ctx) =>
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ctx.db.insert("investmentPlans", { ...basePlan(), createdBy: adminId } as any),
    );

    // No t.withIdentity(...) -- this call is unauthenticated, matching a
    // public marketing page visitor.
    const plans = await t.query(api.investmentPlans.listPublic, {});
    expect(plans).toHaveLength(1);
    expect(plans[0].name).toBe("Growth Plan");
  });

  it("excludes inactive plans", async () => {
    const t = convexTest(schema, modules);
    const adminId = await t.run((ctx) => ctx.db.insert("users", baseUser()));
    await t.run((ctx) =>
      ctx.db.insert(
        "investmentPlans",
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        { ...basePlan({ isActive: false }), createdBy: adminId } as any,
      ),
    );

    const plans = await t.query(api.investmentPlans.listPublic, {});
    expect(plans).toHaveLength(0);
  });

  it("sorts by sortOrder", async () => {
    const t = convexTest(schema, modules);
    const adminId = await t.run((ctx) => ctx.db.insert("users", baseUser()));
    await t.run((ctx) =>
      ctx.db.insert(
        "investmentPlans",
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        { ...basePlan({ name: "Second", sortOrder: 2 }), createdBy: adminId } as any,
      ),
    );
    await t.run((ctx) =>
      ctx.db.insert(
        "investmentPlans",
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        { ...basePlan({ name: "First", sortOrder: 1 }), createdBy: adminId } as any,
      ),
    );

    const plans = await t.query(api.investmentPlans.listPublic, {});
    expect(plans.map((p) => p.name)).toEqual(["First", "Second"]);
  });
});

describe("investmentPlans.create", () => {
  async function seedAdmin(t: ReturnType<typeof convexTest>) {
    const adminId = await t.run((ctx) => ctx.db.insert("users", baseUser()));
    return t.withIdentity({ subject: adminId });
  }

  it("rejects a non-positive minDepositUsd", async () => {
    const t = convexTest(schema, modules);
    const asAdmin = await seedAdmin(t);

    await expect(
      asAdmin.mutation(api.investmentPlans.create, {
        name: "Plan",
        description: "d",
        minDepositUsd: 0,
        currency: "ANY",
        rate: 0.07,
        rateInterval: "weekly",
        durationDays: 14,
        payoutStyle: "accrual",
      }),
    ).rejects.toThrow(/minDepositUsd must be greater than zero/i);
  });

  it("rejects a maxDepositUsd below minDepositUsd", async () => {
    const t = convexTest(schema, modules);
    const asAdmin = await seedAdmin(t);

    await expect(
      asAdmin.mutation(api.investmentPlans.create, {
        name: "Plan",
        description: "d",
        minDepositUsd: 500,
        maxDepositUsd: 100,
        currency: "ANY",
        rate: 0.07,
        rateInterval: "weekly",
        durationDays: 14,
        payoutStyle: "accrual",
      }),
    ).rejects.toThrow(/maxDepositUsd cannot be less than minDepositUsd/i);
  });
});
