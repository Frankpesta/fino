import { v } from "convex/values";
import { internalAction, internalMutation, query } from "./_generated/server";
import { internal } from "./_generated/api";
import { requireVerifiedUser } from "./model/authz";
import { currencyValidator, CURRENCIES } from "./schema";
import type { Currency } from "../lib/currency";

// CoinGecko's free public API -- no key required, good enough for a cached
// display/matching rate refreshed on a cron rather than fetched live in the
// request path. Swap for a paid provider if rate limits become an issue.
const COINGECKO_IDS: Record<Currency, string> = {
  BTC: "bitcoin",
  ETH: "ethereum",
  USDT: "tether",
  USDC: "usd-coin",
  BNB: "binancecoin",
};

export const get = query({
  args: {},
  handler: async (ctx) => {
    await requireVerifiedUser(ctx);
    const rows = await ctx.db.query("exchangeRates").collect();
    const rates: Partial<Record<Currency, { usdRate: number; updatedAt: number }>> = {};
    for (const row of rows) {
      rates[row.currency] = { usdRate: row.usdRate, updatedAt: row.updatedAt };
    }
    return rates;
  },
});

export const upsertRateInternal = internalMutation({
  args: { currency: currencyValidator, usdRate: v.number() },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("exchangeRates")
      .withIndex("by_currency", (q) => q.eq("currency", args.currency))
      .unique();
    const patch = { currency: args.currency, usdRate: args.usdRate, updatedAt: Date.now() };
    if (existing) {
      await ctx.db.patch(existing._id, patch);
    } else {
      await ctx.db.insert("exchangeRates", patch);
    }
  },
});

// One bad/missing price for a single currency shouldn't block refreshing the
// rest -- same per-item isolation as the accrual/finalize crons (see
// convex/investments.ts), since a stale BTC rate is a much smaller problem
// than a stale rate for everything.
export const refreshRatesInternal = internalAction({
  args: {},
  handler: async (ctx) => {
    const errors: string[] = [];
    let prices: Record<string, { usd: number }> | undefined;

    try {
      const ids = Object.values(COINGECKO_IDS).join(",");
      const response = await fetch(
        `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd`,
      );
      if (!response.ok) {
        throw new Error(`CoinGecko responded with ${response.status}`);
      }
      prices = await response.json();
    } catch (err) {
      errors.push(`fetch: ${err instanceof Error ? err.message : String(err)}`);
    }

    if (prices) {
      for (const currency of CURRENCIES) {
        try {
          const usdRate = prices[COINGECKO_IDS[currency]]?.usd;
          if (typeof usdRate !== "number" || !Number.isFinite(usdRate) || usdRate <= 0) {
            throw new Error(`missing or invalid price for ${currency}`);
          }
          await ctx.runMutation(internal.exchangeRates.upsertRateInternal, {
            currency,
            usdRate,
          });
        } catch (err) {
          errors.push(`${currency}: ${err instanceof Error ? err.message : String(err)}`);
        }
      }
    }

    if (errors.length > 0) {
      await ctx.scheduler.runAfter(0, internal.emails.sendCronFailureAlert, {
        cronName: "refreshExchangeRates",
        errorCount: errors.length,
        firstError: errors[0],
      });
    }
  },
});
