import { describe, it, expect } from "vitest";
import { findMatchingPlan, type MatchablePlan } from "./planMatching";

function plan(overrides: Partial<MatchablePlan> = {}): MatchablePlan {
  return {
    _id: "plan1",
    isActive: true,
    currency: "ANY",
    minDepositUsd: 100,
    maxDepositUsd: 5000,
    sortOrder: 0,
    ...overrides,
  };
}

describe("findMatchingPlan", () => {
  it("matches a plan whose range contains the amount", () => {
    const plans = [plan({ _id: "a", minDepositUsd: 100, maxDepositUsd: 5000 })];
    const match = findMatchingPlan(plans, { currency: "BTC", amountUsd: 500 });
    expect(match?._id).toBe("a");
  });

  it("returns null when no plan's range contains the amount", () => {
    const plans = [plan({ minDepositUsd: 100, maxDepositUsd: 5000 })];
    expect(findMatchingPlan(plans, { currency: "BTC", amountUsd: 50 })).toBeNull();
    expect(findMatchingPlan(plans, { currency: "BTC", amountUsd: 5001 })).toBeNull();
  });

  it("treats a missing maxDepositUsd as unlimited", () => {
    const plans = [plan({ minDepositUsd: 5000, maxDepositUsd: undefined })];
    expect(findMatchingPlan(plans, { currency: "BTC", amountUsd: 1_000_000 })?.minDepositUsd).toBe(
      5000,
    );
  });

  it("matches an amount exactly at the boundary (inclusive on both ends)", () => {
    const plans = [plan({ minDepositUsd: 100, maxDepositUsd: 5000 })];
    expect(findMatchingPlan(plans, { currency: "BTC", amountUsd: 100 })).not.toBeNull();
    expect(findMatchingPlan(plans, { currency: "BTC", amountUsd: 5000 })).not.toBeNull();
  });

  it("only matches plans restricted to the deposit's currency, or ANY", () => {
    const btcOnly = plan({ _id: "btc-only", currency: "BTC" });
    const usdtOnly = plan({ _id: "usdt-only", currency: "USDT" });
    const anyCurrency = plan({ _id: "any", currency: "ANY" });

    expect(findMatchingPlan([btcOnly], { currency: "USDT", amountUsd: 500 })).toBeNull();
    expect(findMatchingPlan([usdtOnly], { currency: "USDT", amountUsd: 500 })?._id).toBe(
      "usdt-only",
    );
    expect(findMatchingPlan([anyCurrency], { currency: "BNB", amountUsd: 500 })?._id).toBe("any");
  });

  it("ignores inactive plans even if their range matches", () => {
    const plans = [plan({ isActive: false })];
    expect(findMatchingPlan(plans, { currency: "BTC", amountUsd: 500 })).toBeNull();
  });

  it("picks the lowest sortOrder when multiple plans match", () => {
    const plans = [
      plan({ _id: "second", sortOrder: 2 }),
      plan({ _id: "first", sortOrder: 1 }),
    ];
    expect(findMatchingPlan(plans, { currency: "BTC", amountUsd: 500 })?._id).toBe("first");
  });
});
