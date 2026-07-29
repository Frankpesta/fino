import { cn } from "@/lib/utils";
import type { Currency } from "@/lib/currency";

// Monogram badges instead of third-party brand marks -- avoids trademark
// entanglement and keeps every asset visually consistent with the rest of
// the design system. Swap for real network logos later if desired.
const CURRENCY_STYLES: Record<Currency, string> = {
  BTC: "bg-[oklch(0.75_0.14_60)] text-[oklch(0.2_0.03_60)]",
  ETH: "bg-[oklch(0.75_0.03_264)] text-[oklch(0.2_0.02_264)]",
  USDT: "bg-[oklch(0.7_0.15_155)] text-[oklch(0.15_0.03_155)]",
  USDC: "bg-[oklch(0.65_0.15_255)] text-[oklch(0.95_0.02_255)]",
  BNB: "bg-[oklch(0.8_0.16_90)] text-[oklch(0.2_0.03_90)]",
};

export function CurrencyIcon({
  currency,
  className,
}: {
  currency: Currency;
  className?: string;
}) {
  return (
    <span
      aria-hidden
      className={cn(
        "inline-flex size-6 shrink-0 items-center justify-center rounded-full text-[10px] font-heading font-bold",
        CURRENCY_STYLES[currency],
        className,
      )}
    >
      {currency.slice(0, 1)}
    </span>
  );
}
