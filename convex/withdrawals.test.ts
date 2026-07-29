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

async function seedAdmin(t: ReturnType<typeof convexTest>) {
  const adminId = await t.run((ctx) => ctx.db.insert("users", baseUser({ role: "admin" })));
  return { adminId, asAdmin: t.withIdentity({ subject: adminId }) };
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

describe("withdrawals.approve", () => {
  it("rejects a non-admin caller", async () => {
    const t = convexTest(schema, modules);
    const { asUser } = await seedUserWithBalance(t, 100);
    const withdrawalId = await asUser.mutation(api.withdrawals.create, {
      amount: 50,
      currency: "USDT",
      destinationAddress: "addr",
    });

    await expect(asUser.mutation(api.withdrawals.approve, { withdrawalId })).rejects.toThrow();
  });

  it("deducts balance, logs a transaction and audit row, on approval", async () => {
    const t = convexTest(schema, modules);
    const { userId, asUser } = await seedUserWithBalance(t, 100);
    const { adminId, asAdmin } = await seedAdmin(t);
    const withdrawalId = await asUser.mutation(api.withdrawals.create, {
      amount: 60,
      currency: "USDT",
      destinationAddress: "addr",
    });

    await asAdmin.mutation(api.withdrawals.approve, { withdrawalId });

    const withdrawal = await t.run((ctx) => ctx.db.get(withdrawalId));
    expect(withdrawal?.status).toBe("approved");
    expect(withdrawal?.reviewedBy).toBe(adminId);

    const user = await t.run((ctx) => ctx.db.get(userId));
    expect(user?.balances.USDT).toBe(40);

    const txs = await t.run((ctx) =>
      ctx.db
        .query("transactions")
        .withIndex("by_userId", (q) => q.eq("userId", userId))
        .collect(),
    );
    expect(txs).toHaveLength(1);
    expect(txs[0].type).toBe("withdrawal");
    expect(txs[0].balanceBefore).toBe(100);
    expect(txs[0].balanceAfter).toBe(40);

    const auditLog = await t.run((ctx) => ctx.db.query("adminAuditLog").collect());
    expect(auditLog).toHaveLength(1);
    expect(auditLog[0].action).toBe("approve_withdrawal");
  });

  it("re-checks balance at approval time and rejects if it no longer covers the withdrawal", async () => {
    const t = convexTest(schema, modules);
    const { userId, asUser } = await seedUserWithBalance(t, 100);
    const { asAdmin } = await seedAdmin(t);
    const withdrawalId = await asUser.mutation(api.withdrawals.create, {
      amount: 80,
      currency: "USDT",
      destinationAddress: "addr",
    });

    // Balance drops below the withdrawal amount after the request was made
    // (e.g. an admin adjustment) -- approval must re-validate, not just
    // trust the hold computed at request time.
    await t.run((ctx) => ctx.db.patch(userId, { balances: { BTC: 0, ETH: 0, USDT: 50, USDC: 0, BNB: 0 } }));

    await expect(
      asAdmin.mutation(api.withdrawals.approve, { withdrawalId }),
    ).rejects.toThrow(/no longer covers/i);

    const user = await t.run((ctx) => ctx.db.get(userId));
    expect(user?.balances.USDT).toBe(50); // untouched
  });

  it("rejects approving a withdrawal that isn't pending", async () => {
    const t = convexTest(schema, modules);
    const { asUser } = await seedUserWithBalance(t, 100);
    const { asAdmin } = await seedAdmin(t);
    const withdrawalId = await asUser.mutation(api.withdrawals.create, {
      amount: 50,
      currency: "USDT",
      destinationAddress: "addr",
    });
    await asAdmin.mutation(api.withdrawals.approve, { withdrawalId });

    await expect(asAdmin.mutation(api.withdrawals.approve, { withdrawalId })).rejects.toThrow();
  });
});

describe("withdrawals.recordPayoutTxHash", () => {
  it("only works on an approved withdrawal", async () => {
    const t = convexTest(schema, modules);
    const { asUser } = await seedUserWithBalance(t, 100);
    const { asAdmin } = await seedAdmin(t);
    const withdrawalId = await asUser.mutation(api.withdrawals.create, {
      amount: 50,
      currency: "USDT",
      destinationAddress: "addr",
    });

    await expect(
      asAdmin.mutation(api.withdrawals.recordPayoutTxHash, {
        withdrawalId,
        payoutTxHash: "0xabc",
      }),
    ).rejects.toThrow(/approved/i);

    await asAdmin.mutation(api.withdrawals.approve, { withdrawalId });
    await asAdmin.mutation(api.withdrawals.recordPayoutTxHash, {
      withdrawalId,
      payoutTxHash: "0xabc",
    });

    const withdrawal = await t.run((ctx) => ctx.db.get(withdrawalId));
    expect(withdrawal?.payoutTxHash).toBe("0xabc");
  });
});

describe("withdrawals.reject", () => {
  it("requires a non-empty rejection reason and never touches balance", async () => {
    const t = convexTest(schema, modules);
    const { userId, asUser } = await seedUserWithBalance(t, 100);
    const { asAdmin } = await seedAdmin(t);
    const withdrawalId = await asUser.mutation(api.withdrawals.create, {
      amount: 50,
      currency: "USDT",
      destinationAddress: "addr",
    });

    await expect(
      asAdmin.mutation(api.withdrawals.reject, { withdrawalId, rejectionReason: " " }),
    ).rejects.toThrow(/rejection reason/i);

    await asAdmin.mutation(api.withdrawals.reject, {
      withdrawalId,
      rejectionReason: "Suspicious destination address",
    });

    const withdrawal = await t.run((ctx) => ctx.db.get(withdrawalId));
    expect(withdrawal?.status).toBe("rejected");

    const user = await t.run((ctx) => ctx.db.get(userId));
    expect(user?.balances.USDT).toBe(100);
  });
});

describe("withdrawals.create respects minWithdrawalAmount", () => {
  it("rejects an amount below the configured minimum", async () => {
    const t = convexTest(schema, modules);
    const { asUser } = await seedUserWithBalance(t, 100);
    const { asAdmin } = await seedAdmin(t);

    await asAdmin.mutation(api.platformSettings.updateMinWithdrawalAmount, {
      currency: "USDT",
      amount: 20,
    });

    await expect(
      asUser.mutation(api.withdrawals.create, {
        amount: 10,
        currency: "USDT",
        destinationAddress: "addr",
      }),
    ).rejects.toThrow(/minimum withdrawal/i);

    // Above the minimum still works.
    await asUser.mutation(api.withdrawals.create, {
      amount: 20,
      currency: "USDT",
      destinationAddress: "addr",
    });
  });
});
