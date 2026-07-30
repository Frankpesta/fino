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

async function seedExchangeRate(
  t: ReturnType<typeof convexTest>,
  currency: "BTC" | "ETH" | "USDT" | "USDC" | "BNB" = "USDT",
  usdRate = 1,
) {
  await t.run((ctx) =>
    ctx.db.insert("exchangeRates", { currency, usdRate, updatedAt: Date.now() }),
  );
}

async function seedActivePlan(
  t: ReturnType<typeof convexTest>,
  createdBy: string,
  overrides: Partial<Record<string, unknown>> = {},
) {
  return await t.run((ctx) =>
    ctx.db.insert("investmentPlans", {
      name: "Plan",
      description: "d",
      minDepositUsd: 0,
      currency: "ANY",
      rate: 0.05,
      rateInterval: "weekly",
      durationDays: 14,
      payoutStyle: "accrual",
      isActive: true,
      sortOrder: 0,
      createdBy: createdBy as never,
      createdAt: Date.now(),
      ...overrides,
    }),
  );
}

describe("deposits.create", () => {
  it("throws when there is no active platform wallet for the currency", async () => {
    const t = convexTest(schema, modules);
    const { asUser } = await seedUser(t);

    await expect(
      asUser.mutation(api.deposits.create, {
        amountUsd: 100,
        currency: "USDT",
        txHash: "0xabc",
      }),
    ).rejects.toThrow(/no active deposit address/i);
  });

  it("rejects a non-positive amount", async () => {
    const t = convexTest(schema, modules);
    const { asUser } = await seedUser(t);
    await t.run((ctx) =>
      ctx.db.insert("platformWallets", {
        currency: "USDT",
        address: "T-real-address",
        network: "TRC20",
        isActive: true,
      }),
    );

    await expect(
      asUser.mutation(api.deposits.create, {
        amountUsd: 0,
        currency: "USDT",
        txHash: "0xabc",
      }),
    ).rejects.toThrow(/greater than zero/i);
  });

  it("uses the server-side platform wallet address, never a client-supplied one, and never touches balances", async () => {
    const t = convexTest(schema, modules);
    const { userId, asUser } = await seedUser(t);
    const { adminId } = await seedAdmin(t);
    await t.run((ctx) =>
      ctx.db.insert("platformWallets", {
        currency: "USDT",
        address: "T-real-address",
        network: "TRC20",
        isActive: true,
      }),
    );
    await seedExchangeRate(t);
    await seedActivePlan(t, adminId);

    const depositId = await asUser.mutation(api.deposits.create, {
      amountUsd: 250,
      currency: "USDT",
      txHash: "0xabc",
    });

    const deposit = await t.run((ctx) => ctx.db.get(depositId));
    expect(deposit?.status).toBe("pending");
    expect(deposit?.destinationWalletAddress).toBe("T-real-address");

    const user = await t.run((ctx) => ctx.db.get(userId));
    expect(user?.balances.USDT).toBe(0);
  });

  it("does not use an inactive wallet", async () => {
    const t = convexTest(schema, modules);
    const { asUser } = await seedUser(t);
    await t.run((ctx) =>
      ctx.db.insert("platformWallets", {
        currency: "USDT",
        address: "T-inactive",
        network: "TRC20",
        isActive: false,
      }),
    );

    await expect(
      asUser.mutation(api.deposits.create, {
        amountUsd: 100,
        currency: "USDT",
        txHash: "0xabc",
      }),
    ).rejects.toThrow(/no active deposit address/i);
  });
});

describe("deposits.cancel", () => {
  it("soft-cancels a pending deposit owned by the caller", async () => {
    const t = convexTest(schema, modules);
    const { userId, asUser } = await seedUser(t);
    const depositId = await t.run((ctx) =>
      ctx.db.insert("deposits", {
        userId,
        amount: 50,
        currency: "USDT",
        amountUsd: 50,
        quotedRate: 1,
        destinationWalletAddress: "T-x",
        status: "pending",
        createdAt: Date.now(),
      }),
    );

    await asUser.mutation(api.deposits.cancel, { depositId });

    const deposit = await t.run((ctx) => ctx.db.get(depositId));
    expect(deposit?.status).toBe("cancelled");
  });

  it("rejects cancelling a deposit that isn't pending", async () => {
    const t = convexTest(schema, modules);
    const { userId, asUser } = await seedUser(t);
    const depositId = await t.run((ctx) =>
      ctx.db.insert("deposits", {
        userId,
        amount: 50,
        currency: "USDT",
        amountUsd: 50,
        quotedRate: 1,
        destinationWalletAddress: "T-x",
        status: "approved",
        createdAt: Date.now(),
      }),
    );

    await expect(asUser.mutation(api.deposits.cancel, { depositId })).rejects.toThrow();
  });

  it("rejects cancelling another user's deposit", async () => {
    const t = convexTest(schema, modules);
    const { userId: ownerId } = await seedUser(t);
    const { asUser: asOtherUser } = await seedUser(t);
    const depositId = await t.run((ctx) =>
      ctx.db.insert("deposits", {
        userId: ownerId,
        amount: 50,
        currency: "USDT",
        amountUsd: 50,
        quotedRate: 1,
        destinationWalletAddress: "T-x",
        status: "pending",
        createdAt: Date.now(),
      }),
    );

    await expect(asOtherUser.mutation(api.deposits.cancel, { depositId })).rejects.toThrow();
  });
});

describe("deposits.listMine", () => {
  it("filters by status and only returns the caller's own deposits", async () => {
    const t = convexTest(schema, modules);
    const { userId, asUser } = await seedUser(t);
    const { userId: otherUserId } = await seedUser(t);

    await t.run(async (ctx) => {
      await ctx.db.insert("deposits", {
        userId,
        amount: 10,
        currency: "USDT",
        amountUsd: 10,
        quotedRate: 1,
        destinationWalletAddress: "T-x",
        status: "pending",
        createdAt: Date.now(),
      });
      await ctx.db.insert("deposits", {
        userId,
        amount: 20,
        currency: "USDT",
        amountUsd: 20,
        quotedRate: 1,
        destinationWalletAddress: "T-x",
        status: "approved",
        createdAt: Date.now(),
      });
      await ctx.db.insert("deposits", {
        userId: otherUserId,
        amount: 999,
        currency: "USDT",
        amountUsd: 999,
        quotedRate: 1,
        destinationWalletAddress: "T-x",
        status: "pending",
        createdAt: Date.now(),
      });
    });

    const pending = await asUser.query(api.deposits.listMine, { status: "pending" });
    expect(pending).toHaveLength(1);
    expect(pending[0].amount).toBe(10);

    const all = await asUser.query(api.deposits.listMine, {});
    expect(all).toHaveLength(2);
  });
});

describe("deposits.approve", () => {
  async function seedPendingDeposit(
    t: ReturnType<typeof convexTest>,
    userId: string,
    amount = 100,
  ) {
    return await t.run((ctx) =>
      ctx.db.insert("deposits", {
        userId: userId as never,
        amount,
        currency: "USDT",
        amountUsd: amount,
        quotedRate: 1,
        destinationWalletAddress: "T-x",
        status: "pending",
        createdAt: Date.now(),
      }),
    );
  }

  it("rejects a non-admin caller", async () => {
    const t = convexTest(schema, modules);
    const { userId, asUser } = await seedUser(t);
    const depositId = await seedPendingDeposit(t, userId);

    await expect(asUser.mutation(api.deposits.approve, { depositId })).rejects.toThrow();
  });

  it("credits the depositor's balance, logs a transaction, and an audit row", async () => {
    const t = convexTest(schema, modules);
    const { userId } = await seedUser(t);
    const { adminId, asAdmin } = await seedAdmin(t);
    const depositId = await seedPendingDeposit(t, userId, 250);

    await asAdmin.mutation(api.deposits.approve, { depositId });

    const deposit = await t.run((ctx) => ctx.db.get(depositId));
    expect(deposit?.status).toBe("approved");
    expect(deposit?.reviewedBy).toBe(adminId);
    expect(deposit?.reviewedAt).toBeDefined();

    const user = await t.run((ctx) => ctx.db.get(userId));
    expect(user?.balances.USDT).toBe(250);

    const txs = await t.run((ctx) =>
      ctx.db
        .query("transactions")
        .withIndex("by_userId", (q) => q.eq("userId", userId as never))
        .collect(),
    );
    expect(txs).toHaveLength(1);
    expect(txs[0].type).toBe("deposit");
    expect(txs[0].balanceBefore).toBe(0);
    expect(txs[0].balanceAfter).toBe(250);

    const auditLog = await t.run((ctx) => ctx.db.query("adminAuditLog").collect());
    expect(auditLog).toHaveLength(1);
    expect(auditLog[0].action).toBe("approve_deposit");
    expect(auditLog[0].adminId).toBe(adminId);
  });

  it("rejects approving a deposit that isn't pending", async () => {
    const t = convexTest(schema, modules);
    const { userId } = await seedUser(t);
    const { asAdmin } = await seedAdmin(t);
    const depositId = await t.run((ctx) =>
      ctx.db.insert("deposits", {
        userId: userId as never,
        amount: 100,
        currency: "USDT",
        amountUsd: 100,
        quotedRate: 1,
        destinationWalletAddress: "T-x",
        status: "approved",
        createdAt: Date.now(),
      }),
    );

    await expect(asAdmin.mutation(api.deposits.approve, { depositId })).rejects.toThrow();
  });

  it("credits the referrer's commission when the depositor was referred", async () => {
    const t = convexTest(schema, modules);
    const { userId: referrerId } = await seedUser(t);
    const { userId: referredUserId } = await seedUser(t);
    const { asAdmin } = await seedAdmin(t);

    await t.run((ctx) =>
      ctx.db.insert("referrals", {
        referrerId: referrerId as never,
        referredUserId: referredUserId as never,
        commissionRate: 0.1,
        totalCommissionEarned: { BTC: 0, ETH: 0, USDT: 0, USDC: 0, BNB: 0 },
        createdAt: Date.now(),
      }),
    );
    const depositId = await seedPendingDeposit(t, referredUserId, 1000);

    await asAdmin.mutation(api.deposits.approve, { depositId });

    const referrer = await t.run((ctx) => ctx.db.get(referrerId as never));
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect((referrer as any)?.balances.USDT).toBe(100); // 1000 * 0.1

    const referral = await t.run((ctx) => ctx.db.query("referrals").first());
    expect(referral?.totalCommissionEarned.USDT).toBe(100);

    const referrerTxs = await t.run((ctx) =>
      ctx.db
        .query("transactions")
        .withIndex("by_userId", (q) => q.eq("userId", referrerId as never))
        .collect(),
    );
    expect(referrerTxs).toHaveLength(1);
    expect(referrerTxs[0].type).toBe("referral_commission");
    expect(referrerTxs[0].amount).toBe(100);
  });

  it("does not credit any commission when the depositor was not referred", async () => {
    const t = convexTest(schema, modules);
    const { userId } = await seedUser(t);
    const { asAdmin } = await seedAdmin(t);
    const depositId = await seedPendingDeposit(t, userId, 1000);

    await asAdmin.mutation(api.deposits.approve, { depositId });

    const allTxs = await t.run((ctx) => ctx.db.query("transactions").collect());
    expect(allTxs).toHaveLength(1);
    expect(allTxs[0].type).toBe("deposit");
  });
});

describe("deposits.reject", () => {
  it("rejects a non-admin caller", async () => {
    const t = convexTest(schema, modules);
    const { userId, asUser } = await seedUser(t);
    const depositId = await t.run((ctx) =>
      ctx.db.insert("deposits", {
        userId: userId as never,
        amount: 100,
        currency: "USDT",
        amountUsd: 100,
        quotedRate: 1,
        destinationWalletAddress: "T-x",
        status: "pending",
        createdAt: Date.now(),
      }),
    );

    await expect(
      asUser.mutation(api.deposits.reject, { depositId, rejectionReason: "bad" }),
    ).rejects.toThrow();
  });

  it("requires a non-empty rejection reason", async () => {
    const t = convexTest(schema, modules);
    const { userId } = await seedUser(t);
    const { asAdmin } = await seedAdmin(t);
    const depositId = await t.run((ctx) =>
      ctx.db.insert("deposits", {
        userId: userId as never,
        amount: 100,
        currency: "USDT",
        amountUsd: 100,
        quotedRate: 1,
        destinationWalletAddress: "T-x",
        status: "pending",
        createdAt: Date.now(),
      }),
    );

    await expect(
      asAdmin.mutation(api.deposits.reject, { depositId, rejectionReason: "  " }),
    ).rejects.toThrow(/rejection reason/i);
  });

  it("sets status/reason and logs an audit row without touching balances", async () => {
    const t = convexTest(schema, modules);
    const { userId } = await seedUser(t);
    const { adminId, asAdmin } = await seedAdmin(t);
    const depositId = await t.run((ctx) =>
      ctx.db.insert("deposits", {
        userId: userId as never,
        amount: 100,
        currency: "USDT",
        amountUsd: 100,
        quotedRate: 1,
        destinationWalletAddress: "T-x",
        status: "pending",
        createdAt: Date.now(),
      }),
    );

    await asAdmin.mutation(api.deposits.reject, {
      depositId,
      rejectionReason: "Proof of payment does not match amount",
    });

    const deposit = await t.run((ctx) => ctx.db.get(depositId));
    expect(deposit?.status).toBe("rejected");
    expect(deposit?.rejectionReason).toBe("Proof of payment does not match amount");
    expect(deposit?.reviewedBy).toBe(adminId);

    const user = await t.run((ctx) => ctx.db.get(userId as never));
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect((user as any)?.balances.USDT).toBe(0);

    const auditLog = await t.run((ctx) => ctx.db.query("adminAuditLog").collect());
    expect(auditLog).toHaveLength(1);
    expect(auditLog[0].action).toBe("reject_deposit");
  });
});

// The actual validation *rules* (allowed types, size limit) are exhaustively
// covered by lib/fileValidation.test.ts as pure-function tests --
// convex-test's in-memory storage mock only ever records size/sha256 on a
// stored blob, never contentType (unlike the real Convex backend, which
// captures it from the upload's Content-Type header), so every upload here
// necessarily fails the content-type check regardless of what's passed to
// `new Blob([...], { type })`. These tests instead prove the *wiring*: that
// deposits.create actually calls validateProofUpload, and reacts correctly
// (deletes the orphaned upload, rethrows) when it fails.
describe("deposits.create proof upload wiring", () => {
  async function seedWallet(t: ReturnType<typeof convexTest>) {
    await t.run((ctx) =>
      ctx.db.insert("platformWallets", {
        currency: "USDT",
        address: "T-x",
        network: "TRC20",
        isActive: true,
      }),
    );
    await seedExchangeRate(t);
    const { adminId } = await seedAdmin(t);
    await seedActivePlan(t, adminId);
  }

  it("creates the deposit normally when no proof is attached", async () => {
    const t = convexTest(schema, modules);
    const { asUser } = await seedUser(t);
    await seedWallet(t);

    const depositId = await asUser.mutation(api.deposits.create, {
      amountUsd: 100,
      currency: "USDT",
      txHash: "0xproof-free",
    });

    const deposit = await t.run((ctx) => ctx.db.get(depositId));
    expect(deposit?.proofFileId).toBeUndefined();
  });

  it("rejects an upload that fails validation, and does not create a deposit", async () => {
    const t = convexTest(schema, modules);
    const { asUser } = await seedUser(t);
    await seedWallet(t);

    const storageId = await t.run((ctx) =>
      ctx.storage.store(new Blob(["some-bytes"], { type: "image/png" })),
    );

    await expect(
      asUser.mutation(api.deposits.create, {
        amountUsd: 100,
        currency: "USDT",
        txHash: "0xinvalid-proof",
        proofFileId: storageId,
      }),
    ).rejects.toThrow(/PNG, JPEG, or WebP/);

    // ctx.storage.delete(storageId) does run in this path (see
    // convex/deposits.ts), but convex-test's storage mock doesn't remove the
    // _storage metadata row on delete the way the real backend does, so
    // that specific side effect isn't independently verifiable here. What's
    // verifiable and what matters: no deposit got created.
    const deposits = await t.run((ctx) => ctx.db.query("deposits").collect());
    expect(deposits).toHaveLength(0);
  });
});
