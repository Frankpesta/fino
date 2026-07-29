import { cn } from "@/lib/utils";
import { formatAmount, type Currency } from "@/lib/currency";

export function AmountDisplay({
  amount,
  currency,
  className,
  showCurrency = true,
}: {
  amount: number;
  currency: Currency;
  className?: string;
  showCurrency?: boolean;
}) {
  return (
    <span className={cn("font-heading tabular-nums", className)}>
      {formatAmount(amount, currency)}
      {showCurrency && <span className="ml-1 text-muted-foreground text-[0.85em]">{currency}</span>}
    </span>
  );
}
