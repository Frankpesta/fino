import { describe, it, expect } from "vitest";
import {
  generateVerificationCode,
  isExpired,
  canResend,
  VERIFICATION_CODE_TTL_MS,
  VERIFICATION_RESEND_COOLDOWN_MS,
} from "./verificationCode";

describe("generateVerificationCode", () => {
  it("generates a 6-digit numeric string", () => {
    const code = generateVerificationCode();
    expect(code).toMatch(/^\d{6}$/);
  });

  it("covers the full 100000-999999 range at the boundaries", () => {
    expect(generateVerificationCode(() => 0)).toBe("100000");
    expect(generateVerificationCode(() => 0.999999999)).toBe("999999");
  });
});

describe("isExpired", () => {
  const expiresAt = 1_000_000;

  it("is false before expiry", () => {
    expect(isExpired(expiresAt, expiresAt - 1)).toBe(false);
  });

  it("is true at and after expiry", () => {
    expect(isExpired(expiresAt, expiresAt)).toBe(true);
    expect(isExpired(expiresAt, expiresAt + 1)).toBe(true);
  });

  it("matches the documented 15-minute TTL", () => {
    expect(VERIFICATION_CODE_TTL_MS).toBe(15 * 60 * 1000);
  });
});

describe("canResend", () => {
  const lastSentAt = 1_000_000;

  it("is false immediately after sending", () => {
    expect(canResend(lastSentAt, lastSentAt)).toBe(false);
  });

  it("is false just under the cooldown", () => {
    expect(canResend(lastSentAt, lastSentAt + VERIFICATION_RESEND_COOLDOWN_MS - 1)).toBe(false);
  });

  it("is true once the cooldown has fully elapsed", () => {
    expect(canResend(lastSentAt, lastSentAt + VERIFICATION_RESEND_COOLDOWN_MS)).toBe(true);
  });

  it("matches the documented 1/min rate limit", () => {
    expect(VERIFICATION_RESEND_COOLDOWN_MS).toBe(60 * 1000);
  });
});
