// @vitest-environment edge-runtime
//
// Unlike other test files, this exercises the *real* Convex Auth signup
// flow (api.auth.signIn) rather than seeding a users row directly -- that's
// necessary here because referral attribution happens inside
// createOrUpdateUser, which only runs as part of that real flow.
import { describe, it, expect } from "vitest";
import { convexTest, type TestConvex } from "convex-test";
import schema from "./schema";
import { api } from "./_generated/api";

const modules = import.meta.glob("./**/*.ts");

async function signUp(t: TestConvex<typeof schema>, email: string, ref?: string) {
  await t.action(api.auth.signIn, {
    provider: "password",
    params: {
      email,
      password: "password123",
      flow: "signUp",
      ...(ref ? { ref } : {}),
    },
  });
  return await t.run((ctx) =>
    ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", email))
      .unique(),
  );
}

describe("signup referral attribution", () => {
  it("attributes a signup to the referrer via ?ref= and creates a zeroed referrals row", async () => {
    const t = convexTest(schema, modules);

    const referrer = await signUp(t, "referrer@example.com");
    expect(referrer).not.toBeNull();

    const referred = await signUp(t, "referred@example.com", referrer!.referralCode);
    expect(referred?.referredBy).toBe(referrer!._id);

    const referralRow = await t.run((ctx) =>
      ctx.db
        .query("referrals")
        .withIndex("by_referrerId", (q) => q.eq("referrerId", referrer!._id))
        .unique(),
    );
    expect(referralRow?.referredUserId).toBe(referred!._id);
    expect(referralRow?.totalCommissionEarned).toEqual({
      BTC: 0,
      ETH: 0,
      USDT: 0,
      USDC: 0,
      BNB: 0,
    });
  });

  it("locks in the platform's default commission rate at signup time", async () => {
    const t = convexTest(schema, modules);
    const adminId = await t.run((ctx) =>
      ctx.db.insert("users", {
        email: "admin@example.com",
        emailVerified: true,
        role: "admin",
        status: "active",
        referralCode: "ADMINCOD",
        balances: { BTC: 0, ETH: 0, USDT: 0, USDC: 0, BNB: 0 },
        twoFactorEnabled: false,
        createdAt: Date.now(),
        lastLoginAt: Date.now(),
      }),
    );
    await t
      .withIdentity({ subject: adminId })
      .mutation(api.platformSettings.updateReferralCommissionRateDefault, { rate: 0.08 });

    const referrer = await signUp(t, "referrer2@example.com");
    await signUp(t, "referred2@example.com", referrer!.referralCode);

    const referralRow = await t.run((ctx) =>
      ctx.db
        .query("referrals")
        .withIndex("by_referrerId", (q) => q.eq("referrerId", referrer!._id))
        .unique(),
    );
    expect(referralRow?.commissionRate).toBe(0.08);
  });

  it("does not attribute a signup with an unknown ref code", async () => {
    const t = convexTest(schema, modules);
    const user = await signUp(t, "solo@example.com", "NOTAREAL");

    expect(user?.referredBy).toBeUndefined();
    const referrals = await t.run((ctx) => ctx.db.query("referrals").collect());
    expect(referrals).toHaveLength(0);
  });

  it("does not attribute a signup with no ref code at all", async () => {
    const t = convexTest(schema, modules);
    const user = await signUp(t, "noref@example.com");

    expect(user?.referredBy).toBeUndefined();
  });
});

describe("signIn 2FA enforcement", () => {
  async function signUpAndEnable2FA(t: TestConvex<typeof schema>, email: string) {
    const user = await signUp(t, email);
    await t.run((ctx) => ctx.db.patch(user!._id, { emailVerified: true }));
    const asUser = t.withIdentity({ subject: user!._id });

    const { secret } = await asUser.mutation(api.profile.begin2FASetup, {});
    const { computeTotp } = await import("../lib/totp");
    await asUser.mutation(api.profile.confirm2FASetup, { code: await computeTotp(secret) });

    return { user: user!, secret };
  }

  it("signs in normally when 2FA is not enabled", async () => {
    const t = convexTest(schema, modules);
    await signUp(t, "no2fa@example.com");

    const result = await t.action(api.auth.signIn, {
      provider: "password",
      params: { email: "no2fa@example.com", password: "password123", flow: "signIn" },
    });
    expect(result.tokens).toBeTruthy();
  });

  it("throws the 2FA_REQUIRED sentinel when a code is needed but not given", async () => {
    const t = convexTest(schema, modules);
    await signUpAndEnable2FA(t, "has2fa@example.com");

    await expect(
      t.action(api.auth.signIn, {
        provider: "password",
        params: { email: "has2fa@example.com", password: "password123", flow: "signIn" },
      }),
    ).rejects.toThrow(/2FA_REQUIRED/);
  });

  it("rejects an incorrect 2FA code", async () => {
    const t = convexTest(schema, modules);
    await signUpAndEnable2FA(t, "has2fa2@example.com");

    await expect(
      t.action(api.auth.signIn, {
        provider: "password",
        params: {
          email: "has2fa2@example.com",
          password: "password123",
          flow: "signIn",
          code: "000000",
        },
      }),
    ).rejects.toThrow(/invalid code/i);
  });

  it("rejects a correct-format 2FA code with the wrong password", async () => {
    const t = convexTest(schema, modules);
    const { secret } = await signUpAndEnable2FA(t, "has2fa3@example.com");
    const { computeTotp } = await import("../lib/totp");

    await expect(
      t.action(api.auth.signIn, {
        provider: "password",
        params: {
          email: "has2fa3@example.com",
          password: "wrong-password",
          flow: "signIn",
          code: await computeTotp(secret),
        },
      }),
    ).rejects.toThrow(/invalid credentials/i);
  });

  it("signs in successfully with the correct password and 2FA code", async () => {
    const t = convexTest(schema, modules);
    const { secret } = await signUpAndEnable2FA(t, "has2fa4@example.com");
    const { computeTotp } = await import("../lib/totp");

    const result = await t.action(api.auth.signIn, {
      provider: "password",
      params: {
        email: "has2fa4@example.com",
        password: "password123",
        flow: "signIn",
        code: await computeTotp(secret),
      },
    });
    expect(result.tokens).toBeTruthy();
  });

  it("rate-limits repeated wrong 2FA codes, and resets on success", async () => {
    const t = convexTest(schema, modules);
    const { secret } = await signUpAndEnable2FA(t, "has2fa5@example.com");
    const { computeTotp } = await import("../lib/totp");

    for (let i = 0; i < 10; i++) {
      await expect(
        t.action(api.auth.signIn, {
          provider: "password",
          params: {
            email: "has2fa5@example.com",
            password: "password123",
            flow: "signIn",
            code: "000000",
          },
        }),
      ).rejects.toThrow(/invalid code/i);
    }

    // The 11th attempt should be rate-limited rather than just "invalid
    // code", even with the *correct* code -- proves it blocks on attempt
    // count, not on repeatedly guessing wrong.
    await expect(
      t.action(api.auth.signIn, {
        provider: "password",
        params: {
          email: "has2fa5@example.com",
          password: "password123",
          flow: "signIn",
          code: await computeTotp(secret),
        },
      }),
    ).rejects.toThrow(/too many failed attempts/i);
  });
});
