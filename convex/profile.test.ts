// @vitest-environment edge-runtime
import { describe, it, expect } from "vitest";
import { convexTest } from "convex-test";
import schema from "./schema";
import { api } from "./_generated/api";
import { computeTotp } from "../lib/totp";

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

describe("profile.updateName", () => {
  it("rejects an empty name", async () => {
    const t = convexTest(schema, modules);
    const { asUser } = await seedUser(t);
    await expect(asUser.mutation(api.profile.updateName, { name: "  " })).rejects.toThrow();
  });

  it("updates the name", async () => {
    const t = convexTest(schema, modules);
    const { userId, asUser } = await seedUser(t);
    await asUser.mutation(api.profile.updateName, { name: "Jane Doe" });
    const user = await t.run((ctx) => ctx.db.get(userId));
    expect(user?.name).toBe("Jane Doe");
  });
});

describe("profile account deletion", () => {
  it("requests then cancels a deletion", async () => {
    const t = convexTest(schema, modules);
    const { userId, asUser } = await seedUser(t);

    await asUser.mutation(api.profile.requestAccountDeletion, {});
    let user = await t.run((ctx) => ctx.db.get(userId));
    expect(user?.deletionRequestedAt).toBeDefined();

    await asUser.mutation(api.profile.cancelAccountDeletionRequest, {});
    user = await t.run((ctx) => ctx.db.get(userId));
    expect(user?.deletionRequestedAt).toBeUndefined();
  });
});

describe("profile 2FA flow", () => {
  it("begin2FASetup stores a secret but does not enable 2FA yet", async () => {
    const t = convexTest(schema, modules);
    const { userId, asUser } = await seedUser(t);

    const result = await asUser.mutation(api.profile.begin2FASetup, {});
    expect(result.secret).toMatch(/^[A-Z2-7]+$/);
    expect(result.uri).toContain("otpauth://totp/");

    const user = await t.run((ctx) => ctx.db.get(userId));
    // Stored encrypted, not as plaintext (see lib/secretBox.ts) -- only this
    // one response ever carries the plaintext secret.
    expect(user?.twoFactorSecret).toBeDefined();
    expect(user?.twoFactorSecret).not.toBe(result.secret);
    expect(user?.twoFactorEnabled).toBe(false);
  });

  it("confirm2FASetup enables 2FA given a valid code", async () => {
    const t = convexTest(schema, modules);
    const { userId, asUser } = await seedUser(t);

    const { secret } = await asUser.mutation(api.profile.begin2FASetup, {});
    const code = await computeTotp(secret);
    await asUser.mutation(api.profile.confirm2FASetup, { code });

    const user = await t.run((ctx) => ctx.db.get(userId));
    expect(user?.twoFactorEnabled).toBe(true);
  });

  it("confirm2FASetup rejects an invalid code and does not enable 2FA", async () => {
    const t = convexTest(schema, modules);
    const { userId, asUser } = await seedUser(t);

    await asUser.mutation(api.profile.begin2FASetup, {});
    await expect(
      asUser.mutation(api.profile.confirm2FASetup, { code: "000000" }),
    ).rejects.toThrow(/invalid code/i);

    const user = await t.run((ctx) => ctx.db.get(userId));
    expect(user?.twoFactorEnabled).toBe(false);
  });

  it("confirm2FASetup rejects if no setup was started", async () => {
    const t = convexTest(schema, modules);
    const { asUser } = await seedUser(t);
    await expect(
      asUser.mutation(api.profile.confirm2FASetup, { code: "123456" }),
    ).rejects.toThrow(/no 2fa setup/i);
  });

  it("disable2FA clears the secret given a valid code", async () => {
    const t = convexTest(schema, modules);
    const { userId, asUser } = await seedUser(t);

    const { secret } = await asUser.mutation(api.profile.begin2FASetup, {});
    await asUser.mutation(api.profile.confirm2FASetup, { code: await computeTotp(secret) });

    await asUser.mutation(api.profile.disable2FA, { code: await computeTotp(secret) });

    const user = await t.run((ctx) => ctx.db.get(userId));
    expect(user?.twoFactorEnabled).toBe(false);
    expect(user?.twoFactorSecret).toBeUndefined();
  });

  it("disable2FA rejects an invalid code and leaves 2FA enabled", async () => {
    const t = convexTest(schema, modules);
    const { userId, asUser } = await seedUser(t);

    const { secret } = await asUser.mutation(api.profile.begin2FASetup, {});
    await asUser.mutation(api.profile.confirm2FASetup, { code: await computeTotp(secret) });

    await expect(
      asUser.mutation(api.profile.disable2FA, { code: "000000" }),
    ).rejects.toThrow(/invalid code/i);

    const user = await t.run((ctx) => ctx.db.get(userId));
    expect(user?.twoFactorEnabled).toBe(true);
  });

  it("disable2FA rejects if 2FA isn't enabled", async () => {
    const t = convexTest(schema, modules);
    const { asUser } = await seedUser(t);
    await expect(
      asUser.mutation(api.profile.disable2FA, { code: "123456" }),
    ).rejects.toThrow(/not enabled/i);
  });
});
