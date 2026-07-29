// @vitest-environment edge-runtime
//
// Requires `convex/_generated/*` to exist, which requires the one-time
// `npx convex dev` login (see project notes) -- convex-test loads the real
// function modules via import.meta.glob, and those modules import from
// "./_generated/server". Run `npm test` after that setup step to execute
// this file; until then it will fail to resolve imports, same as `tsc`.
import { describe, it, expect } from "vitest";
import { convexTest } from "convex-test";
import schema from "../schema";
import { requireUser, requireVerifiedUser, requireAdmin, AuthzError } from "./authz";

const modules = import.meta.glob("../**/*.ts");

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

describe("requireUser", () => {
  it("throws when there is no authenticated identity", async () => {
    const t = convexTest(schema, modules);
    await expect(t.run((ctx) => requireUser(ctx))).rejects.toThrow(AuthzError);
  });

  it("returns the user doc for an authenticated identity", async () => {
    const t = convexTest(schema, modules);
    const userId = await t.run((ctx) => ctx.db.insert("users", baseUser()));
    const asUser = t.withIdentity({ subject: userId });
    const user = await asUser.run((ctx) => requireUser(ctx));
    expect(user._id).toBe(userId);
  });
});

describe("requireVerifiedUser", () => {
  it("throws if the email is not verified", async () => {
    const t = convexTest(schema, modules);
    const userId = await t.run((ctx) =>
      ctx.db.insert("users", baseUser({ emailVerified: false })),
    );
    const asUser = t.withIdentity({ subject: userId });
    await expect(asUser.run((ctx) => requireVerifiedUser(ctx))).rejects.toThrow(AuthzError);
  });

  it("throws if the account is suspended", async () => {
    const t = convexTest(schema, modules);
    const userId = await t.run((ctx) =>
      ctx.db.insert("users", baseUser({ status: "suspended" })),
    );
    const asUser = t.withIdentity({ subject: userId });
    await expect(asUser.run((ctx) => requireVerifiedUser(ctx))).rejects.toThrow(AuthzError);
  });

  it("passes for a verified, active user", async () => {
    const t = convexTest(schema, modules);
    const userId = await t.run((ctx) => ctx.db.insert("users", baseUser()));
    const asUser = t.withIdentity({ subject: userId });
    const user = await asUser.run((ctx) => requireVerifiedUser(ctx));
    expect(user._id).toBe(userId);
  });
});

describe("requireAdmin", () => {
  it("throws for a non-admin user", async () => {
    const t = convexTest(schema, modules);
    const userId = await t.run((ctx) => ctx.db.insert("users", baseUser({ role: "user" })));
    const asUser = t.withIdentity({ subject: userId });
    await expect(asUser.run((ctx) => requireAdmin(ctx))).rejects.toThrow(AuthzError);
  });

  it("passes for an admin user", async () => {
    const t = convexTest(schema, modules);
    const userId = await t.run((ctx) => ctx.db.insert("users", baseUser({ role: "admin" })));
    const asUser = t.withIdentity({ subject: userId });
    const user = await asUser.run((ctx) => requireAdmin(ctx));
    expect(user.role).toBe("admin");
  });
});
