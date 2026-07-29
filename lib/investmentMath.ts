import { round8, multiplyMoney } from "./money";

export type RateInterval = "daily" | "weekly" | "monthly";

// Calendar-day equivalents used to pro-rate a stated interval rate down to a
// daily figure. "monthly" uses a flat 30-day approximation -- documented
// here rather than computing real calendar months, so accrual math stays
// simple and auditable (see docs/04-phase-3-investment-plans.md 3.2, which
// leaves the exact convention to us as long as it's consistent).
export const INTERVAL_DAYS: Record<RateInterval, number> = {
  daily: 1,
  weekly: 7,
  monthly: 30,
};

export const ONE_DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Every active investment accrues once per day regardless of its stated
 * rateInterval, pro-rated down from that interval's rate. E.g. a "5% /
 * week" plan credits 5%/7 of principal each day. This is the "daily
 * pro-rated ticking" behavior decided for this build over "jump only on
 * interval."
 */
export function dailyAccrualAmount(
  principal: number,
  rate: number,
  rateInterval: RateInterval,
): number {
  return multiplyMoney(principal, rate / INTERVAL_DAYS[rateInterval]);
}

/**
 * Guards the accrual cron against double-paying on a re-trigger within the
 * same day. A small tolerance (1 hour) absorbs cron scheduling jitter
 * without letting a full extra day slip through.
 */
export function isAccrualDue(lastAccrualAt: number, now: number): boolean {
  const tolerance = 60 * 60 * 1000;
  return now - lastAccrualAt >= ONE_DAY_MS - tolerance;
}

export function computeEndsAt(startedAt: number, durationDays: number): number {
  return startedAt + durationDays * ONE_DAY_MS;
}

/** Projected total principal + total accrued would reach by full term, assuming daily accrual continues at the current rate for the remaining days. */
export function projectedTotalAtTermEnd(
  principal: number,
  rate: number,
  rateInterval: RateInterval,
  durationDays: number,
): number {
  const totalAccrual = multiplyMoney(
    dailyAccrualAmount(principal, rate, rateInterval),
    durationDays,
  );
  return round8(principal + totalAccrual);
}
