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

describe("deposits.create", () => {
  it("throws when there is no active platform wallet for the currency", async () => {
    const t = convexTest(schema, modules);
    const { asUser } = await seedUser(t);

    await expect(
      asUser.mutation(api.deposits.create, { amount: 100, currency: "USDT" }),
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
      asUser.mutation(api.deposits.create, { amount: 0, currency: "USDT" }),
    ).rejects.toThrow(/greater than zero/i);
  });

  it("uses the server-side platform wallet address, never a client-supplied one, and never touches balances", async () => {
    const t = convexTest(schema, modules);
    const { userId, asUser } = await seedUser(t);
    await t.run((ctx) =>
      ctx.db.insert("platformWallets", {
        currency: "USDT",
        address: "T-real-address",
        network: "TRC20",
        isActive: true,
      }),
    );

    const depositId = await asUser.mutation(api.deposits.create, {
      amount: 250,
      currency: "USDT",
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
      asUser.mutation(api.deposits.create, { amount: 100, currency: "USDT" }),
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
        destinationWalletAddress: "T-x",
        status: "pending",
        createdAt: Date.now(),
      });
      await ctx.db.insert("deposits", {
        userId,
        amount: 20,
        currency: "USDT",
        destinationWalletAddress: "T-x",
        status: "approved",
        createdAt: Date.now(),
      });
      await ctx.db.insert("deposits", {
        userId: otherUserId,
        amount: 999,
        currency: "USDT",
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
