import { describe, it, expect } from "vitest";
import { round8, addMoney, subtractMoney, multiplyMoney, isMoneyPrecision, applyDelta } from "./money";

describe("round8", () => {
  it("rounds to 8 decimal places", () => {
    expect(round8(1.123456789)).toBe(1.12345679);
  });

  it("corrects classic binary float error", () => {
    expect(round8(0.1 + 0.2)).toBe(0.3);
  });

  it("leaves already-precise values untouched", () => {
    expect(round8(1.5)).toBe(1.5);
    expect(round8(0)).toBe(0);
  });

  it("rejects non-finite input", () => {
    expect(() => round8(Infinity)).toThrow(RangeError);
    expect(() => round8(NaN)).toThrow(RangeError);
  });
});

describe("addMoney / subtractMoney / multiplyMoney", () => {
  it("adds without float drift", () => {
    expect(addMoney(0.1, 0.2)).toBe(0.3);
  });

  it("subtracts without float drift", () => {
    expect(subtractMoney(0.3, 0.1)).toBe(0.2);
  });

  it("multiplies and rounds the result (e.g. principal * rate)", () => {
    expect(multiplyMoney(1000, 0.05)).toBe(50);
    expect(multiplyMoney(133.33333333, 0.1)).toBe(13.33333333);
  });

  it("handles repeated small additions the way a daily accrual cron would", () => {
    let total = 0;
    for (let i = 0; i < 100; i++) {
      total = addMoney(total, 0.00000001);
    }
    expect(total).toBe(0.000001);
  });
});

describe("isMoneyPrecision", () => {
  it("is true for values already at 8dp", () => {
    expect(isMoneyPrecision(1.12345678)).toBe(true);
  });

  it("is false for values with more than 8dp", () => {
    expect(isMoneyPrecision(1.123456789)).toBe(false);
  });
});

describe("applyDelta", () => {
  it("applies a positive delta", () => {
    expect(applyDelta(10, 5)).toBe(15);
  });

  it("applies a negative delta that keeps balance non-negative", () => {
    expect(applyDelta(10, -5)).toBe(5);
  });

  it("allows a delta that lands exactly on zero", () => {
    expect(applyDelta(10, -10)).toBe(0);
  });

  it("throws rather than allow an overdraft", () => {
    expect(() => applyDelta(10, -10.00000001)).toThrow(RangeError);
  });
});
