// @vitest-environment edge-runtime
//
// Uses the real signup flow (api.auth.signIn) rather than seeding a users
// row directly -- changePassword's retrieveAccount/modifyAccountCredentials
// operate on the real authAccounts table, which only exists for accounts
// created through that flow.
import { describe, it, expect } from "vitest";
import { convexTest, type TestConvex } from "convex-test";
import schema from "./schema";
import { api } from "./_generated/api";

const modules = import.meta.glob("./**/*.ts");

async function signUp(t: TestConvex<typeof schema>, email: string, password: string) {
  await t.action(api.auth.signIn, {
    provider: "password",
    params: { email, password, flow: "signUp" },
  });
  const user = await t.run((ctx) =>
    ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", email))
      .unique(),
  );
  return user!;
}

describe("profileActions.changePassword", () => {
  it("rejects an incorrect current password", async () => {
    const t = convexTest(schema, modules);
    const user = await signUp(t, "user@example.com", "correct-password");
    const asUser = t.withIdentity({ subject: user._id });

    await expect(
      asUser.action(api.profileActions.changePassword, {
        currentPassword: "wrong-password",
        newPassword: "new-password-123",
      }),
    ).rejects.toThrow(/incorrect/i);
  });

  it("rejects a new password shorter than 8 characters", async () => {
    const t = convexTest(schema, modules);
    const user = await signUp(t, "user2@example.com", "correct-password");
    const asUser = t.withIdentity({ subject: user._id });

    await expect(
      asUser.action(api.profileActions.changePassword, {
        currentPassword: "correct-password",
        newPassword: "short",
      }),
    ).rejects.toThrow(/8 characters/i);
  });

  it("changes the password so the old one no longer signs in and the new one does", async () => {
    const t = convexTest(schema, modules);
    const email = "user3@example.com";
    const user = await signUp(t, email, "old-password-123");
    const asUser = t.withIdentity({ subject: user._id });

    await asUser.action(api.profileActions.changePassword, {
      currentPassword: "old-password-123",
      newPassword: "new-password-456",
    });

    await expect(
      t.action(api.auth.signIn, {
        provider: "password",
        params: { email, password: "old-password-123", flow: "signIn" },
      }),
    ).rejects.toThrow();

    const result = await t.action(api.auth.signIn, {
      provider: "password",
      params: { email, password: "new-password-456", flow: "signIn" },
    });
    expect(result.tokens).toBeTruthy();
  });
});

describe("profileActions.revokeSession", () => {
  it("rejects revoking a session that doesn't belong to the caller", async () => {
    const t = convexTest(schema, modules);
    const userA = await signUp(t, "a@example.com", "password-123");
    const userB = await signUp(t, "b@example.com", "password-123");

    const sessionOfB = await t.run((ctx) =>
      ctx.db
        .query("authSessions")
        .withIndex("userId", (q) => q.eq("userId", userB._id))
        .first(),
    );
    expect(sessionOfB).not.toBeNull();

    const asUserA = t.withIdentity({ subject: userA._id });
    await expect(
      asUserA.action(api.profileActions.revokeSession, { sessionId: sessionOfB!._id }),
    ).rejects.toThrow(/not found/i);
  });

  it("revokes the caller's own session", async () => {
    const t = convexTest(schema, modules);
    const user = await signUp(t, "c@example.com", "password-123");

    const session = await t.run((ctx) =>
      ctx.db
        .query("authSessions")
        .withIndex("userId", (q) => q.eq("userId", user._id))
        .first(),
    );
    expect(session).not.toBeNull();

    const asUser = t.withIdentity({ subject: user._id });
    await asUser.action(api.profileActions.revokeSession, { sessionId: session!._id });

    const remaining = await t.run((ctx) => ctx.db.get(session!._id));
    expect(remaining).toBeNull();
  });
});
