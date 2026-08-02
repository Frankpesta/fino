import { describe, it, expect } from "vitest";
import { base32Encode } from "./base32";
import { generateTotpSecret, generateTotpUri, computeTotp, verifyTotp } from "./totp";

// RFC 6238 Appendix B defines standard test vectors for the 20-byte ASCII
// secret "12345678901234567890" at specific Unix timestamps, as 8-digit
// SHA1 codes. Since 10^6 divides 10^8, the 6-digit code this module
// produces is mathematically just the last 6 digits of the RFC's 8-digit
// vector -- so these are a real cross-check against an external spec, not
// just internal self-consistency.
const RFC_SECRET_BASE32 = base32Encode(new TextEncoder().encode("12345678901234567890"));
const RFC_VECTORS: [number, string][] = [
  [59, "287082"],
  [1111111109, "081804"],
  [1111111111, "050471"],
  [1234567890, "005924"],
  [2000000000, "279037"],
];

describe("computeTotp", () => {
  it.each(RFC_VECTORS)("matches the RFC 6238 vector at unix time %d", async (unixSeconds, expected) => {
    expect(await computeTotp(RFC_SECRET_BASE32, unixSeconds * 1000)).toBe(expected);
  });
});

describe("verifyTotp", () => {
  it("accepts the exact current code", async () => {
    const secret = generateTotpSecret();
    const now = Date.now();
    const code = await computeTotp(secret, now);
    expect(await verifyTotp(secret, code, { forTimeMs: now })).toBe(true);
  });

  it("rejects an incorrect code", async () => {
    const secret = generateTotpSecret();
    expect(await verifyTotp(secret, "000000", { forTimeMs: Date.now() })).toBe(false);
  });

  it("tolerates one time-step of clock drift by default", async () => {
    const secret = generateTotpSecret();
    const now = Date.now();
    const codeOneStepAgo = await computeTotp(secret, now - 30_000);
    expect(await verifyTotp(secret, codeOneStepAgo, { forTimeMs: now })).toBe(true);
  });

  it("rejects a code outside the tolerance window", async () => {
    const secret = generateTotpSecret();
    const now = Date.now();
    const codeFarInPast = await computeTotp(secret, now - 5 * 30_000);
    expect(await verifyTotp(secret, codeFarInPast, { forTimeMs: now })).toBe(false);
  });
});

describe("generateTotpSecret", () => {
  it("generates a valid-looking base32 string each time, non-repeating", () => {
    const a = generateTotpSecret();
    const b = generateTotpSecret();
    expect(a).toMatch(/^[A-Z2-7]+$/);
    expect(a).not.toBe(b);
  });
});

describe("generateTotpUri", () => {
  it("produces a well-formed otpauth:// URI", () => {
    const uri = generateTotpUri({
      secretBase32: "JBSWY3DPEHPK3PXP",
      accountName: "user@example.com",
      issuer: "Zypherex",
    });
    expect(uri).toMatch(/^otpauth:\/\/totp\/Zypherex%3Auser%40example\.com\?/);
    expect(uri).toContain("secret=JBSWY3DPEHPK3PXP");
    expect(uri).toContain("issuer=Zypherex");
    expect(uri).toContain("digits=6");
    expect(uri).toContain("period=30");
  });
});
