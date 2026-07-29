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

describe("platformWallets.upsert", () => {
  it("rejects a non-admin caller", async () => {
    const t = convexTest(schema, modules);
    const userId = await t.run((ctx) => ctx.db.insert("users", baseUser({ role: "user" })));
    const asUser = t.withIdentity({ subject: userId });

    await expect(
      asUser.mutation(api.platformWallets.upsert, {
        currency: "USDT",
        address: "T-x",
        network: "TRC20",
        isActive: true,
      }),
    ).rejects.toThrow();
  });

  it("allows an admin to create then update the address for a currency (no duplicates)", async () => {
    const t = convexTest(schema, modules);
    const adminId = await t.run((ctx) => ctx.db.insert("users", baseUser({ role: "admin" })));
    const asAdmin = t.withIdentity({ subject: adminId });

    await asAdmin.mutation(api.platformWallets.upsert, {
      currency: "USDT",
      address: "T-first",
      network: "TRC20",
      isActive: true,
    });
    await asAdmin.mutation(api.platformWallets.upsert, {
      currency: "USDT",
      address: "T-second",
      network: "TRC20",
      isActive: true,
    });

    const wallets = await t.run((ctx) => ctx.db.query("platformWallets").collect());
    expect(wallets).toHaveLength(1);
    expect(wallets[0].address).toBe("T-second");
  });
});
