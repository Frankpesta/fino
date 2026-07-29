import { describe, it, expect } from "vitest";
import { generateReferralCode, isValidReferralCodeFormat, REFERRAL_CODE_LENGTH } from "./referralCode";

describe("generateReferralCode", () => {
  it("generates a code of the expected length", () => {
    expect(generateReferralCode()).toHaveLength(REFERRAL_CODE_LENGTH);
  });

  it("never includes visually ambiguous characters (0/O, 1/I/L)", () => {
    for (let i = 0; i < 200; i++) {
      const code = generateReferralCode();
      expect(code).not.toMatch(/[01OIL]/);
    }
  });

  it("is deterministic given a deterministic random source", () => {
    const sequence = [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7];
    const makeFakeRandom = () => {
      let i = 0;
      return () => sequence[i++];
    };
    expect(generateReferralCode(makeFakeRandom())).toBe(generateReferralCode(makeFakeRandom()));
  });
});

describe("isValidReferralCodeFormat", () => {
  it("accepts a well-formed code", () => {
    expect(isValidReferralCodeFormat("ABCDEFGH")).toBe(true);
  });

  it("rejects the wrong length", () => {
    expect(isValidReferralCodeFormat("ABC")).toBe(false);
  });

  it("rejects ambiguous characters", () => {
    expect(isValidReferralCodeFormat("ABCDEFG0")).toBe(false);
    expect(isValidReferralCodeFormat("ABCDEFGI")).toBe(false);
  });
});
