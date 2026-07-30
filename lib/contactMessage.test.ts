import { describe, it, expect } from "vitest";
import { validateContactMessage, CONTACT_MESSAGE_LIMITS } from "./contactMessage";

const VALID = {
  name: "Jane Doe",
  email: "jane@example.com",
  subject: "Question",
  message: "This is a perfectly valid message body.",
};

describe("validateContactMessage", () => {
  it("accepts a valid message", () => {
    expect(() => validateContactMessage(VALID)).not.toThrow();
  });

  it("rejects an empty or whitespace-only name", () => {
    expect(() => validateContactMessage({ ...VALID, name: "" })).toThrow(/name is required/i);
    expect(() => validateContactMessage({ ...VALID, name: "   " })).toThrow(/name is required/i);
  });

  it("rejects a name over the length limit", () => {
    expect(() =>
      validateContactMessage({ ...VALID, name: "a".repeat(CONTACT_MESSAGE_LIMITS.name + 1) }),
    ).toThrow(/too long/i);
  });

  it("rejects malformed emails", () => {
    for (const bad of ["not-an-email", "missing-domain@", "@missing-local.com", "no-at-sign.com"]) {
      expect(() => validateContactMessage({ ...VALID, email: bad })).toThrow(/valid email/i);
    }
  });

  it("rejects an empty subject", () => {
    expect(() => validateContactMessage({ ...VALID, subject: "  " })).toThrow(
      /subject is required/i,
    );
  });

  it("rejects a message under 10 characters", () => {
    expect(() => validateContactMessage({ ...VALID, message: "short" })).toThrow(
      /at least 10 characters/i,
    );
  });

  it("rejects a message over the length limit", () => {
    expect(() =>
      validateContactMessage({
        ...VALID,
        message: "a".repeat(CONTACT_MESSAGE_LIMITS.message + 1),
      }),
    ).toThrow(/too long/i);
  });
});
