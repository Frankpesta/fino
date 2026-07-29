export const CURRENCIES = ["BTC", "ETH", "USDT", "USDC", "BNB"] as const;
export type Currency = (typeof CURRENCIES)[number];

// Decimal places used for *display* only -- storage is always fixed at 8dp
// (see lib/money.ts). Stablecoins read cleaner at 2dp; BTC/ETH/BNB keep more
// precision since sub-cent fractional amounts are common.
export const DISPLAY_DECIMALS: Record<Currency, number> = {
  BTC: 8,
  ETH: 6,
  BNB: 6,
  USDT: 2,
  USDC: 2,
};

export function formatAmount(amount: number, currency: Currency): string {
  const decimals = DISPLAY_DECIMALS[currency];
  return amount.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}
