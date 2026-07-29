/**
 * Fixed-precision decimal helpers for all balance/amount math.
 *
 * Every asset is stored as a JS number rounded to 8 decimal places on every
 * write. Never write a raw float (e.g. the direct result of `a + b`) into a
 * balance or transaction field -- route it through `round8` (or one of the
 * arithmetic helpers below, which round internally) first, to avoid float
 * drift accumulating across thousands of mutations.
 */

export const MONEY_DECIMALS = 8;
const SCALE = 10 ** MONEY_DECIMALS;

/** Round a number to 8 decimal places, correcting for binary float error. */
export function round8(value: number): number {
  if (!Number.isFinite(value)) {
    throw new RangeError(`round8: value must be finite, got ${value}`);
  }
  return Math.round((value + Number.EPSILON) * SCALE) / SCALE;
}

export function addMoney(a: number, b: number): number {
  return round8(a + b);
}

export function subtractMoney(a: number, b: number): number {
  return round8(a - b);
}

export function multiplyMoney(a: number, factor: number): number {
  return round8(a * factor);
}

/** True if `value` is already exactly representable at 8dp (i.e. round8 is a no-op). */
export function isMoneyPrecision(value: number): boolean {
  return round8(value) === value;
}

/**
 * Add `delta` to a balance, rejecting the result if it would go negative.
 * Use for any debit (withdrawal, investment) where overdraft must be impossible.
 */
export function applyDelta(current: number, delta: number): number {
  const next = addMoney(current, delta);
  if (next < 0) {
    throw new RangeError(
      `applyDelta: resulting balance ${next} would be negative (current=${current}, delta=${delta})`,
    );
  }
  return next;
}
