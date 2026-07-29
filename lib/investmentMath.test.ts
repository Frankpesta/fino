import { describe, it, expect } from "vitest";
import {
  dailyAccrualAmount,
  isAccrualDue,
  computeEndsAt,
  projectedTotalAtTermEnd,
  INTERVAL_DAYS,
  ONE_DAY_MS,
} from "./investmentMath";

describe("dailyAccrualAmount", () => {
  it("pro-rates a weekly rate down to a daily figure", () => {
    // 5% / week on 1000 principal -> 1000 * 0.05 / 7 per day
    expect(dailyAccrualAmount(1000, 0.05, "weekly")).toBeCloseTo(7.142857, 5);
  });

  it("pays the full rate each day for a daily-rate plan", () => {
    expect(dailyAccrualAmount(1000, 0.02, "daily")).toBe(20);
  });

  it("pro-rates a monthly rate over 30 days", () => {
    expect(dailyAccrualAmount(3000, 0.09, "monthly")).toBe(9);
  });

  it("returns 0 for 0 principal", () => {
    expect(dailyAccrualAmount(0, 0.05, "weekly")).toBe(0);
  });
});

describe("isAccrualDue", () => {
  const now = 10_000_000_000;

  it("is false immediately after the last accrual", () => {
    expect(isAccrualDue(now, now)).toBe(false);
  });

  it("is false just under a day later", () => {
    expect(isAccrualDue(now, now + ONE_DAY_MS - 2 * 60 * 60 * 1000)).toBe(false);
  });

  it("is true a full day later", () => {
    expect(isAccrualDue(now, now + ONE_DAY_MS)).toBe(true);
  });

  it("tolerates up to an hour of cron jitter early", () => {
    expect(isAccrualDue(now, now + ONE_DAY_MS - 30 * 60 * 1000)).toBe(true);
  });
});

describe("computeEndsAt", () => {
  it("adds durationDays worth of ms to startedAt", () => {
    const startedAt = 1_000_000;
    expect(computeEndsAt(startedAt, 30)).toBe(startedAt + 30 * ONE_DAY_MS);
  });
});

describe("projectedTotalAtTermEnd", () => {
  it("projects principal plus the full term's accrual", () => {
    // 1000 principal, 7%/week, 14-day term -> daily = 10, total accrual = 140
    expect(projectedTotalAtTermEnd(1000, 0.07, "weekly", 14)).toBe(1140);
  });
});

describe("INTERVAL_DAYS", () => {
  it("matches the documented convention", () => {
    expect(INTERVAL_DAYS).toEqual({ daily: 1, weekly: 7, monthly: 30 });
  });
});
