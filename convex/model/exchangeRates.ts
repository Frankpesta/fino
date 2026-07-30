import type { QueryCtx } from "../_generated/server";
import type { Currency } from "../../lib/currency";

/** Cached rate for one currency, or 0 if the cron hasn't populated it yet. */
export async function getCachedUsdRate(ctx: QueryCtx, currency: Currency): Promise<number> {
  const row = await ctx.db
    .query("exchangeRates")
    .withIndex("by_currency", (q) => q.eq("currency", currency))
    .unique();
  return row?.usdRate ?? 0;
}

export async function getAllCachedUsdRates(
  ctx: QueryCtx,
): Promise<Partial<Record<Currency, number>>> {
  const rows = await ctx.db.query("exchangeRates").collect();
  const rates: Partial<Record<Currency, number>> = {};
  for (const row of rows) {
    rates[row.currency] = row.usdRate;
  }
  return rates;
}
