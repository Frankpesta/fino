import type { QueryCtx } from "../_generated/server";
import type { Currency } from "../../lib/currency";

export const SETTINGS_KEYS = {
  minWithdrawalAmount: "minWithdrawalAmount",
  referralCommissionRateDefault: "referralCommissionRateDefault",
  supportContact: "supportContact",
} as const;

export function defaultMinWithdrawalAmount(): Record<Currency, number> {
  return { BTC: 0, ETH: 0, USDT: 0, USDC: 0, BNB: 0 };
}

export async function getMinWithdrawalAmount(
  ctx: QueryCtx,
  currency: Currency,
): Promise<number> {
  const row = await ctx.db
    .query("platformSettings")
    .withIndex("by_key", (q) => q.eq("key", SETTINGS_KEYS.minWithdrawalAmount))
    .unique();
  const perCurrency = (row?.value as Record<Currency, number> | undefined) ??
    defaultMinWithdrawalAmount();
  return perCurrency[currency] ?? 0;
}
