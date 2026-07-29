// @vitest-environment edge-runtime
import { describe, it, expect } from "vitest";
import { convexTest } from "convex-test";
import schema from "./schema";
import { api } from "./_generated/api";

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

async function seedUser(t: ReturnType<typeof convexTest>) {
  const userId = await t.run((ctx) => ctx.db.insert("users", baseUser()));
  return { userId, asUser: t.withIdentity({ subject: userId }) };
}

async function seedAdmin(t: ReturnType<typeof convexTest>) {
  const adminId = await t.run((ctx) => ctx.db.insert("users", baseUser({ role: "admin" })));
  return { adminId, asAdmin: t.withIdentity({ subject: adminId }) };
}

describe("users.adjustBalance", () => {
  it("rejects a non-admin caller", async () => {
    const t = convexTest(schema, modules);
    const { userId, asUser } = await seedUser(t);

    await expect(
      asUser.mutation(api.users.adjustBalance, {
        userId,
        currency: "USDT",
        delta: 100,
        note: "trying to self-adjust",
      }),
    ).rejects.toThrow();
  });

  it("requires a note of at least 5 characters", async () => {
    const t = convexTest(schema, modules);
    const { userId } = await seedUser(t);
    const { asAdmin } = await seedAdmin(t);

    await expect(
      asAdmin.mutation(api.users.adjustBalance, {
        userId,
        currency: "USDT",
        delta: 100,
        note: "hi",
      }),
    ).rejects.toThrow(/note/i);
  });

  it("rejects a zero delta", async () => {
    const t = convexTest(schema, modules);
    const { userId } = await seedUser(t);
    const { asAdmin } = await seedAdmin(t);

    await expect(
      asAdmin.mutation(api.users.adjustBalance, {
        userId,
        currency: "USDT",
        delta: 0,
        note: "no-op adjustment",
      }),
    ).rejects.toThrow();
  });

  it("applies a positive delta and logs a transaction + audit row", async () => {
    const t = convexTest(schema, modules);
    const { userId } = await seedUser(t);
    const { adminId, asAdmin } = await seedAdmin(t);

    await asAdmin.mutation(api.users.adjustBalance, {
      userId,
      currency: "USDT",
      delta: 150,
      note: "Manual correction for support ticket #42",
    });

    const user = await t.run((ctx) => ctx.db.get(userId));
    expect(user?.balances.USDT).toBe(150);

    const txs = await t.run((ctx) =>
      ctx.db
        .query("transactions")
        .withIndex("by_userId", (q) => q.eq("userId", userId))
        .collect(),
    );
    expect(txs).toHaveLength(1);
    expect(txs[0].type).toBe("admin_adjustment");
    expect(txs[0].note).toBe("Manual correction for support ticket #42");

    const auditLog = await t.run((ctx) => ctx.db.query("adminAuditLog").collect());
    expect(auditLog).toHaveLength(1);
    expect(auditLog[0].action).toBe("admin_adjustment");
    expect(auditLog[0].adminId).toBe(adminId);
  });

  it("rejects a negative delta that would overdraw the balance", async () => {
    const t = convexTest(schema, modules);
    const { userId } = await seedUser(t);
    const { asAdmin } = await seedAdmin(t);

    await expect(
      asAdmin.mutation(api.users.adjustBalance, {
        userId,
        currency: "USDT",
        delta: -50,
        note: "Trying to deduct from a zero balance",
      }),
    ).rejects.toThrow();
  });
});

describe("users.setStatus", () => {
  it("rejects a non-admin caller", async () => {
    const t = convexTest(schema, modules);
    const { userId, asUser } = await seedUser(t);

    await expect(
      asUser.mutation(api.users.setStatus, { userId, status: "suspended" }),
    ).rejects.toThrow();
  });

  it("updates status and logs an audit row", async () => {
    const t = convexTest(schema, modules);
    const { userId } = await seedUser(t);
    const { asAdmin } = await seedAdmin(t);

    await asAdmin.mutation(api.users.setStatus, { userId, status: "suspended" });

    const user = await t.run((ctx) => ctx.db.get(userId));
    expect(user?.status).toBe("suspended");

    const auditLog = await t.run((ctx) => ctx.db.query("adminAuditLog").collect());
    expect(auditLog[0].action).toBe("set_user_status");
  });

  it("blocks a suspended user from money-moving mutations", async () => {
    const t = convexTest(schema, modules);
    const { userId, asUser } = await seedUser(t);
    const { asAdmin } = await seedAdmin(t);

    await asAdmin.mutation(api.users.setStatus, { userId, status: "suspended" });

    await expect(
      asUser.mutation(api.withdrawals.create, {
        amount: 1,
        currency: "USDT",
        destinationAddress: "addr",
      }),
    ).rejects.toThrow();
  });
});
