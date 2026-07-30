// @vitest-environment edge-runtime
//
// Smoke tests that the scheduled email actions triggered by real mutations
// actually run to completion without error -- exercises the full chain
// (mutation -> ctx.scheduler.runAfter -> internal action -> internal query
// -> deliverEmail's stub path, since RESEND_API_KEY isn't set in tests).
// Doesn't assert on delivery itself (there's no real Resend call to
// inspect), just that nothing in the wiring throws.
import { describe, it, expect } from "vitest";
import { convexTest } from "convex-test";
import schema from "./schema";
import { api, internal } from "./_generated/api";

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

async function seedUser(t: ReturnType<typeof convexTest>, overrides = {}) {
  const userId = await t.run((ctx) => ctx.db.insert("users", baseUser(overrides)));
  return { userId, asUser: t.withIdentity({ subject: userId }) };
}

async function seedAdmin(t: ReturnType<typeof convexTest>) {
  const adminId = await t.run((ctx) => ctx.db.insert("users", baseUser({ role: "admin" })));
  return { adminId, asAdmin: t.withIdentity({ subject: adminId }) };
}

describe("email triggers run without error", () => {
  it("deposit submitted", async () => {
    const t = convexTest(schema, modules);
    const { asUser } = await seedUser(t);
    await t.run((ctx) =>
      ctx.db.insert("platformWallets", {
        currency: "USDT",
        address: "T-x",
        network: "TRC20",
        isActive: true,
      }),
    );

    const adminId = await t.run((ctx) => ctx.db.insert("users", baseUser({ role: "admin" })));
    await t.run((ctx) => ctx.db.insert("exchangeRates", { currency: "USDT", usdRate: 1, updatedAt: Date.now() }));
    await t.run((ctx) => ctx.db.insert("investmentPlans", {
      name: "Starter", description: "Test plan", minDepositUsd: 1, currency: "USDT", rate: 0.05,
      rateInterval: "weekly", durationDays: 14, payoutStyle: "accrual", isActive: true,
      sortOrder: 0, createdBy: adminId, createdAt: Date.now(),
    }));
    await asUser.mutation(api.deposits.create, { amountUsd: 100, currency: "USDT", txHash: "0xsubmitted" });
    await expect(t.finishInProgressScheduledFunctions()).resolves.not.toThrow();
  });

  it("deposit approved, including the referral commission email", async () => {
    const t = convexTest(schema, modules);
    const { userId: referrerId } = await seedUser(t, { email: "referrer@example.com" });
    const { userId: referredId } = await seedUser(t, { email: "referred@example.com" });
    const { asAdmin } = await seedAdmin(t);

    await t.run((ctx) =>
      ctx.db.insert("referrals", {
        referrerId,
        referredUserId: referredId,
        commissionRate: 0.1,
        totalCommissionEarned: { BTC: 0, ETH: 0, USDT: 0, USDC: 0, BNB: 0 },
        createdAt: Date.now(),
      }),
    );
    const depositId = await t.run((ctx) =>
      ctx.db.insert("deposits", {
        userId: referredId,
        amount: 500,
        currency: "USDT",
        amountUsd: 500,
        quotedRate: 1,
        destinationWalletAddress: "T-x",
        status: "pending",
        createdAt: Date.now(),
      }),
    );

    await asAdmin.mutation(api.deposits.approve, { depositId });
    await expect(t.finishInProgressScheduledFunctions()).resolves.not.toThrow();
  });

  it("deposit rejected", async () => {
    const t = convexTest(schema, modules);
    const { userId } = await seedUser(t);
    const { asAdmin } = await seedAdmin(t);
    const depositId = await t.run((ctx) =>
      ctx.db.insert("deposits", {
        userId,
        amount: 100,
        currency: "USDT",
        amountUsd: 100,
        quotedRate: 1,
        destinationWalletAddress: "T-x",
        status: "pending",
        createdAt: Date.now(),
      }),
    );

    await asAdmin.mutation(api.deposits.reject, { depositId, rejectionReason: "bad proof" });
    await expect(t.finishInProgressScheduledFunctions()).resolves.not.toThrow();
  });

  it("withdrawal submitted and approved", async () => {
    const t = convexTest(schema, modules);
    const { asUser } = await seedUser(t, {
      balances: { BTC: 0, ETH: 0, USDT: 200, USDC: 0, BNB: 0 },
    });
    const { asAdmin } = await seedAdmin(t);

    const withdrawalId = await asUser.mutation(api.withdrawals.create, {
      amount: 50,
      currency: "USDT",
      destinationAddress: "addr",
    });
    await t.finishInProgressScheduledFunctions();

    await asAdmin.mutation(api.withdrawals.approve, { withdrawalId });
    await expect(t.finishInProgressScheduledFunctions()).resolves.not.toThrow();
  });

  it("investment started and matured (via finalize sweep)", async () => {
    const t = convexTest(schema, modules);
    const { asUser } = await seedUser(t, {
      balances: { BTC: 0, ETH: 0, USDT: 1000, USDC: 0, BNB: 0 },
    });
    const { adminId } = await seedAdmin(t);
    await t.run((ctx) =>
      ctx.db.insert("exchangeRates", { currency: "USDT", usdRate: 1, updatedAt: Date.now() }),
    );

    const planId = await t.run((ctx) =>
      ctx.db.insert("investmentPlans", {
        name: "Growth Plan",
        description: "Test plan",
        minDepositUsd: 100,
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

    const investmentId = await asUser.mutation(api.investments.invest, {
      planId,
      currency: "USDT",
      amount: 500,
    });
    await expect(t.finishInProgressScheduledFunctions()).resolves.not.toThrow();

    // Force it to be due for finalization and run the sweep directly.
    await t.run((ctx) => ctx.db.patch(investmentId, { endsAt: Date.now() - 1 }));
    await t.mutation(internal.investments.runFinalizeSweep, {});
    await expect(t.finishInProgressScheduledFunctions()).resolves.not.toThrow();
  });

  it("security notice on password change and 2FA toggle", async () => {
    const t = convexTest(schema, modules);
    await t.action(api.auth.signIn, {
      provider: "password",
      params: { email: "secure@example.com", password: "old-password-123", flow: "signUp" },
    });
    const user = await t.run((ctx) =>
      ctx.db
        .query("users")
        .withIndex("by_email", (q) => q.eq("email", "secure@example.com"))
        .unique(),
    );
    await t.run((ctx) => ctx.db.patch(user!._id, { emailVerified: true }));
    const asUser = t.withIdentity({ subject: user!._id });

    await asUser.action(api.profileActions.changePassword, {
      currentPassword: "old-password-123",
      newPassword: "new-password-456",
    });
    await expect(t.finishInProgressScheduledFunctions()).resolves.not.toThrow();

    const { secret } = await asUser.mutation(api.profile.begin2FASetup, {});
    const { computeTotp } = await import("../lib/totp");
    await asUser.mutation(api.profile.confirm2FASetup, { code: await computeTotp(secret) });
    await expect(t.finishInProgressScheduledFunctions()).resolves.not.toThrow();
  });

  it("cron failure alert targets only admins, not regular users, and doesn't throw", async () => {
    const t = convexTest(schema, modules);
    const { adminId: admin1 } = await seedAdmin(t);
    const { adminId: admin2 } = await seedAdmin(t);
    await seedUser(t); // a regular user must not be targeted by this alert

    const admins = await t.query(internal.users.listAdminsInternal, {});
    expect(admins.map((a) => a._id).sort()).toEqual([admin1, admin2].sort());
    expect(admins.every((a) => a.role === "admin")).toBe(true);

    await expect(
      t.action(internal.emails.sendCronFailureAlert, {
        cronName: "runDailyAccrual",
        errorCount: 2,
        firstError: "investment xyz: some failure",
      }),
    ).resolves.not.toThrow();
  });
});
