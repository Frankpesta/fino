// @vitest-environment edge-runtime
import { describe, it, expect } from "vitest";
import { convexTest, type TestConvex } from "convex-test";
import schema from "./schema";
import { api } from "./_generated/api";
import { VERIFICATION_RESEND_COOLDOWN_MS } from "../lib/verificationCode";

const modules = import.meta.glob("./**/*.ts");

async function signUp(t: TestConvex<typeof schema>, email: string, password: string) {
  await t.action(api.auth.signIn, {
    provider: "password",
    params: { email, password, flow: "signUp" },
  });
  return await t.run((ctx) =>
    ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", email))
      .unique(),
  );
}

describe("passwordReset.requestReset", () => {
  it("returns success for an email that doesn't exist, without creating anything", async () => {
    const t = convexTest(schema, modules);
    const result = await t.mutation(api.passwordReset.requestReset, {
      email: "nobody@example.com",
    });
    expect(result.success).toBe(true);

    const resets = await t.run((ctx) => ctx.db.query("passwordResets").collect());
    expect(resets).toHaveLength(0);
  });

  it("creates a reset code and schedules an email for a real account", async () => {
    const t = convexTest(schema, modules);
    const user = await signUp(t, "real@example.com", "password123");

    const result = await t.mutation(api.passwordReset.requestReset, { email: "real@example.com" });
    expect(result.success).toBe(true);

    const resets = await t.run((ctx) =>
      ctx.db
        .query("passwordResets")
        .withIndex("by_userId", (q) => q.eq("userId", user!._id))
        .collect(),
    );
    expect(resets).toHaveLength(1);

    await expect(t.finishInProgressScheduledFunctions()).resolves.not.toThrow();
  });

  it("rate-limits repeated requests within the cooldown window", async () => {
    const t = convexTest(schema, modules);
    await signUp(t, "cooldown@example.com", "password123");

    await t.mutation(api.passwordReset.requestReset, { email: "cooldown@example.com" });
    await t.mutation(api.passwordReset.requestReset, { email: "cooldown@example.com" });

    const resets = await t.run((ctx) => ctx.db.query("passwordResets").collect());
    expect(resets).toHaveLength(1);
  });
});

describe("passwordResetActions.confirmReset", () => {
  async function requestAndGetCode(t: TestConvex<typeof schema>, email: string) {
    await t.mutation(api.passwordReset.requestReset, { email });
    const user = await t.run((ctx) =>
      ctx.db
        .query("users")
        .withIndex("by_email", (q) => q.eq("email", email))
        .unique(),
    );
    const record = await t.run((ctx) =>
      ctx.db
        .query("passwordResets")
        .withIndex("by_userId", (q) => q.eq("userId", user!._id))
        .order("desc")
        .first(),
    );
    return record!.code;
  }

  it("rejects a code for an email that doesn't exist with the generic message", async () => {
    const t = convexTest(schema, modules);
    await expect(
      t.action(api.passwordResetActions.confirmReset, {
        email: "ghost@example.com",
        code: "123456",
        newPassword: "new-password-123",
      }),
    ).rejects.toThrow(/invalid or expired code/i);
  });

  it("rejects an incorrect code with the same generic message (no enumeration)", async () => {
    const t = convexTest(schema, modules);
    await signUp(t, "wrongcode@example.com", "password123");
    await t.mutation(api.passwordReset.requestReset, { email: "wrongcode@example.com" });

    await expect(
      t.action(api.passwordResetActions.confirmReset, {
        email: "wrongcode@example.com",
        code: "000000",
        newPassword: "new-password-123",
      }),
    ).rejects.toThrow(/invalid or expired code/i);
  });

  it("rejects a new password shorter than 8 characters", async () => {
    const t = convexTest(schema, modules);
    await signUp(t, "shortpw@example.com", "password123");
    const code = await requestAndGetCode(t, "shortpw@example.com");

    await expect(
      t.action(api.passwordResetActions.confirmReset, {
        email: "shortpw@example.com",
        code,
        newPassword: "short",
      }),
    ).rejects.toThrow(/8 characters/i);
  });

  it("resets the password so the old one fails and the new one works", async () => {
    const t = convexTest(schema, modules);
    const email = "reset@example.com";
    await signUp(t, email, "old-password-123");
    const code = await requestAndGetCode(t, email);

    await t.action(api.passwordResetActions.confirmReset, {
      email,
      code,
      newPassword: "brand-new-password-456",
    });

    await expect(
      t.action(api.auth.signIn, {
        provider: "password",
        params: { email, password: "old-password-123", flow: "signIn" },
      }),
    ).rejects.toThrow();

    const result = await t.action(api.auth.signIn, {
      provider: "password",
      params: { email, password: "brand-new-password-456", flow: "signIn" },
    });
    expect(result.tokens).toBeTruthy();
  });

  it("rejects reusing an already-consumed code", async () => {
    const t = convexTest(schema, modules);
    const email = "reuse@example.com";
    await signUp(t, email, "old-password-123");
    const code = await requestAndGetCode(t, email);

    await t.action(api.passwordResetActions.confirmReset, {
      email,
      code,
      newPassword: "new-password-789",
    });

    await expect(
      t.action(api.passwordResetActions.confirmReset, {
        email,
        code,
        newPassword: "another-password-000",
      }),
    ).rejects.toThrow(/invalid or expired code/i);
  });

  it("rejects an expired code", async () => {
    const t = convexTest(schema, modules);
    const email = "expired@example.com";
    const user = await signUp(t, email, "old-password-123");

    await t.run((ctx) =>
      ctx.db.insert("passwordResets", {
        userId: user!._id,
        code: "654321",
        expiresAt: Date.now() - 1,
        lastSentAt: Date.now() - VERIFICATION_RESEND_COOLDOWN_MS - 1,
      }),
    );

    await expect(
      t.action(api.passwordResetActions.confirmReset, {
        email,
        code: "654321",
        newPassword: "new-password-123",
      }),
    ).rejects.toThrow(/invalid or expired code/i);
  });
});
