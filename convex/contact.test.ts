// @vitest-environment edge-runtime
import { describe, it, expect } from "vitest";
import { convexTest } from "convex-test";
import schema from "./schema";
import { api } from "./_generated/api";

const modules = import.meta.glob("./**/*.ts");

const VALID = {
  name: "Jane Doe",
  email: "jane@example.com",
  subject: "Question about withdrawals",
  message: "How long does a withdrawal review usually take?",
};

describe("contact.submit", () => {
  it("stores a valid message and schedules an admin notification", async () => {
    const t = convexTest(schema, modules);
    const result = await t.mutation(api.contact.submit, VALID);
    expect(result.success).toBe(true);

    const messages = await t.run((ctx) => ctx.db.query("contactMessages").collect());
    expect(messages).toHaveLength(1);
    expect(messages[0]).toMatchObject(VALID);

    await expect(t.finishInProgressScheduledFunctions()).resolves.not.toThrow();
  });

  it("silently succeeds without storing anything when the honeypot is filled", async () => {
    const t = convexTest(schema, modules);
    const result = await t.mutation(api.contact.submit, { ...VALID, company: "Bot Co" });
    expect(result.success).toBe(true);

    const messages = await t.run((ctx) => ctx.db.query("contactMessages").collect());
    expect(messages).toHaveLength(0);
  });

  it("rejects an invalid email", async () => {
    const t = convexTest(schema, modules);
    await expect(
      t.mutation(api.contact.submit, { ...VALID, email: "not-an-email" }),
    ).rejects.toThrow(/valid email/i);
  });

  it("rejects a message that's too short", async () => {
    const t = convexTest(schema, modules);
    await expect(
      t.mutation(api.contact.submit, { ...VALID, message: "too short" }),
    ).rejects.toThrow(/at least 10 characters/i);
  });

  it("rejects an empty name", async () => {
    const t = convexTest(schema, modules);
    await expect(t.mutation(api.contact.submit, { ...VALID, name: "  " })).rejects.toThrow(
      /name is required/i,
    );
  });
});
