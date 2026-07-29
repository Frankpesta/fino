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

async function seedUserWithBalance(t: ReturnType<typeof convexTest>, usdt: number) {
  const userId = await t.run((ctx) =>
    ctx.db.insert(
      "users",
      baseUser({ balances: { BTC: 0, ETH: 0, USDT: usdt, USDC: 0, BNB: 0 } }),
    ),
  );
  return { userId, asUser: t.withIdentity({ subject: userId }) };
}

describe("withdrawals.getAvailableBalance", () => {
  it("equals the raw balance when there are no pending withdrawals", async () => {
    const t = convexTest(schema, modules);
    const { asUser } = await seedUserWithBalance(t, 500);
    const available = await asUser.query(api.withdrawals.getAvailableBalance, {
      currency: "USDT",
    });
    expect(available).toBe(500);
  });

  it("subtracts pending withdrawals for the same currency", async () => {
    const t = convexTest(schema, modules);
    const { userId, asUser } = await seedUserWithBalance(t, 500);
    await t.run((ctx) =>
      ctx.db.insert("withdrawals", {
        userId,
        amount: 150,
        currency: "USDT",
        destinationAddress: "addr",
        status: "pending",
        createdAt: Date.now(),
      }),
    );

    const available = await asUser.query(api.withdrawals.getAvailableBalance, {
      currency: "USDT",
    });
    expect(available).toBe(350);
  });

  it("ignores pending withdrawals in a different currency", async () => {
    const t = convexTest(schema, modules);
    const { userId, asUser } = await seedUserWithBalance(t, 500);
    await t.run((ctx) =>
      ctx.db.insert("withdrawals", {
        userId,
        amount: 150,
        currency: "BTC",
        destinationAddress: "addr",
        status: "pending",
        createdAt: Date.now(),
      }),
    );

    const available = await asUser.query(api.withdrawals.getAvailableBalance, {
      currency: "USDT",
    });
    expect(available).toBe(500);
  });

  it("ignores non-pending withdrawals (approved/rejected/cancelled don't hold funds)", async () => {
    const t = convexTest(schema, modules);
    const { userId, asUser } = await seedUserWithBalance(t, 500);
    await t.run(async (ctx) => {
      for (const status of ["approved", "rejected", "cancelled"] as const) {
        await ctx.db.insert("withdrawals", {
          userId,
          amount: 100,
          currency: "USDT",
          destinationAddress: "addr",
          status,
          createdAt: Date.now(),
        });
      }
    });

    const available = await asUser.query(api.withdrawals.getAvailableBalance, {
      currency: "USDT",
    });
    expect(available).toBe(500);
  });
});

describe("withdrawals.create", () => {
  it("rejects an amount above available balance", async () => {
    const t = convexTest(schema, modules);
    const { asUser } = await seedUserWithBalance(t, 100);

    await expect(
      asUser.mutation(api.withdrawals.create, {
        amount: 150,
        currency: "USDT",
        destinationAddress: "addr",
      }),
    ).rejects.toThrow(/exceeds available balance/i);
  });

  it("succeeds within available balance and never touches `balances`", async () => {
    const t = convexTest(schema, modules);
    const { userId, asUser } = await seedUserWithBalance(t, 100);

    const withdrawalId = await asUser.mutation(api.withdrawals.create, {
      amount: 60,
      currency: "USDT",
      destinationAddress: "addr",
    });

    const withdrawal = await t.run((ctx) => ctx.db.get(withdrawalId));
    expect(withdrawal?.status).toBe("pending");

    const user = await t.run((ctx) => ctx.db.get(userId));
    expect(user?.balances.USDT).toBe(100);
  });

  it("prevents double-spending the same balance across two pending requests", async () => {
    const t = convexTest(schema, modules);
    const { asUser } = await seedUserWithBalance(t, 100);

    await asUser.mutation(api.withdrawals.create, {
      amount: 70,
      currency: "USDT",
      destinationAddress: "addr",
    });

    await expect(
      asUser.mutation(api.withdrawals.create, {
        amount: 70,
        currency: "USDT",
        destinationAddress: "addr",
      }),
    ).rejects.toThrow(/exceeds available balance/i);
  });

  it("rejects an empty destination address", async () => {
    const t = convexTest(schema, modules);
    const { asUser } = await seedUserWithBalance(t, 100);

    await expect(
      asUser.mutation(api.withdrawals.create, {
        amount: 10,
        currency: "USDT",
        destinationAddress: "   ",
      }),
    ).rejects.toThrow(/destination address/i);
  });
});

describe("withdrawals.cancel", () => {
  it("soft-cancels a pending withdrawal and frees up the held amount", async () => {
    const t = convexTest(schema, modules);
    const { asUser } = await seedUserWithBalance(t, 100);

    const withdrawalId = await asUser.mutation(api.withdrawals.create, {
      amount: 70,
      currency: "USDT",
      destinationAddress: "addr",
    });

    let available = await asUser.query(api.withdrawals.getAvailableBalance, {
      currency: "USDT",
    });
    expect(available).toBe(30);

    await asUser.mutation(api.withdrawals.cancel, { withdrawalId });

    const withdrawal = await t.run((ctx) => ctx.db.get(withdrawalId));
    expect(withdrawal?.status).toBe("cancelled");

    available = await asUser.query(api.withdrawals.getAvailableBalance, { currency: "USDT" });
    expect(available).toBe(100);
  });

  it("rejects cancelling another user's withdrawal", async () => {
    const t = convexTest(schema, modules);
    const { asUser: asOwner } = await seedUserWithBalance(t, 100);
    const { asUser: asOther } = await seedUserWithBalance(t, 100);

    const withdrawalId = await asOwner.mutation(api.withdrawals.create, {
      amount: 10,
      currency: "USDT",
      destinationAddress: "addr",
    });

    await expect(asOther.mutation(api.withdrawals.cancel, { withdrawalId })).rejects.toThrow();
  });
});
