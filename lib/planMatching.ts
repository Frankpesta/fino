import type { Currency } from "./currency";

export interface MatchablePlan {
  _id: string;
  isActive: boolean;
  currency: Currency | "ANY";
  minDepositUsd: number;
  maxDepositUsd?: number;
  sortOrder: number;
}

/**
 * Picks the plan a deposit's live USD value falls into. A plan restricted to
 * one currency only matches deposits in that currency; "ANY" matches every
 * currency. When more than one active plan's range contains the amount, the
 * lowest `sortOrder` wins -- deterministic, and matches the order plans are
 * already displayed in everywhere else.
 */
export function findMatchingPlan<T extends MatchablePlan>(
  plans: T[],
  { currency, amountUsd }: { currency: Currency; amountUsd: number },
): T | null {
  const candidates = plans.filter(
    (plan) =>
      plan.isActive &&
      (plan.currency === currency || plan.currency === "ANY") &&
      amountUsd >= plan.minDepositUsd &&
      (plan.maxDepositUsd === undefined || amountUsd <= plan.maxDepositUsd),
  );
  if (candidates.length === 0) return null;
  return candidates.sort((a, b) => a.sortOrder - b.sortOrder)[0];
}
