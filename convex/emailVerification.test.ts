// @vitest-environment edge-runtime
//
// Same caveat as convex/model/authz.test.ts: needs `npx convex dev` run once
// first so `convex/_generated/*` exists.
import { describe, it, expect } from "vitest";
import { convexTest } from "convex-test";
import schema from "./schema";
import { api } from "./_generated/api";
import { VERIFICATION_CODE_TTL_MS, VERIFICATION_RESEND_COOLDOWN_MS } from "../lib/verificationCode";

const modules = import.meta.glob("./**/*.ts");

function baseUser(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    email: "user@example.com",
    emailVerified: false,
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

describe("verifyCode", () => {
  it("marks the user verified on a correct, unexpired code", async () => {
    const t = convexTest(schema, modules);
    const now = Date.now();
    const userId = await t.run(async (ctx) => {
      const id = await ctx.db.insert("users", baseUser());
      await ctx.db.insert("emailVerifications", {
        userId: id,
        code: "123456",
        expiresAt: now + VERIFICATION_CODE_TTL_MS,
        lastSentAt: now,
      });
      return id;
    });

    const asUser = t.withIdentity({ subject: userId });
    await asUser.mutation(api.emailVerification.verifyCode, { code: "123456" });

    const user = await t.run((ctx) => ctx.db.get(userId));
    expect(user?.emailVerified).toBe(true);
  });

  it("rejects an incorrect code without verifying", async () => {
    const t = convexTest(schema, modules);
    const now = Date.now();
    const userId = await t.run(async (ctx) => {
      const id = await ctx.db.insert("users", baseUser());
      await ctx.db.insert("emailVerifications", {
        userId: id,
        code: "123456",
        expiresAt: now + VERIFICATION_CODE_TTL_MS,
        lastSentAt: now,
      });
      return id;
    });

    const asUser = t.withIdentity({ subject: userId });
    await expect(
      asUser.mutation(api.emailVerification.verifyCode, { code: "000000" }),
    ).rejects.toThrow();

    const user = await t.run((ctx) => ctx.db.get(userId));
    expect(user?.emailVerified).toBe(false);
  });

  it("rejects an expired code", async () => {
    const t = convexTest(schema, modules);
    const now = Date.now();
    const userId = await t.run(async (ctx) => {
      const id = await ctx.db.insert("users", baseUser());
      await ctx.db.insert("emailVerifications", {
        userId: id,
        code: "123456",
        expiresAt: now - 1,
        lastSentAt: now - VERIFICATION_CODE_TTL_MS,
      });
      return id;
    });

    const asUser = t.withIdentity({ subject: userId });
    await expect(
      asUser.mutation(api.emailVerification.verifyCode, { code: "123456" }),
    ).rejects.toThrow();
  });
});

describe("resendCode", () => {
  it("rejects a resend within the cooldown window", async () => {
    const t = convexTest(schema, modules);
    const now = Date.now();
    const userId = await t.run(async (ctx) => {
      const id = await ctx.db.insert("users", baseUser());
      await ctx.db.insert("emailVerifications", {
        userId: id,
        code: "123456",
        expiresAt: now + VERIFICATION_CODE_TTL_MS,
        lastSentAt: now,
      });
      return id;
    });

    const asUser = t.withIdentity({ subject: userId });
    await expect(asUser.mutation(api.emailVerification.resendCode, {})).rejects.toThrow();
  });

  it("allows a resend once the cooldown has elapsed and issues a new code", async () => {
    const t = convexTest(schema, modules);
    const now = Date.now();
    const userId = await t.run(async (ctx) => {
      const id = await ctx.db.insert("users", baseUser());
      await ctx.db.insert("emailVerifications", {
        userId: id,
        code: "123456",
        expiresAt: now + VERIFICATION_CODE_TTL_MS,
        lastSentAt: now - VERIFICATION_RESEND_COOLDOWN_MS,
      });
      return id;
    });

    const asUser = t.withIdentity({ subject: userId });
    await asUser.mutation(api.emailVerification.resendCode, {});

    const records = await t.run((ctx) =>
      ctx.db
        .query("emailVerifications")
        .withIndex("by_userId", (q) => q.eq("userId", userId))
        .collect(),
    );
    expect(records).toHaveLength(2);
  });
});
