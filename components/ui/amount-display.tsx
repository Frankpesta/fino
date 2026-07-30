"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { cn } from "@/lib/utils";
import { formatAmount, type Currency } from "@/lib/currency";
import { withReducedMotion } from "@/lib/motion";

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
  const ref = useRef<HTMLSpanElement>(null);
  const previousAmount = useRef(amount);

  // Flashes green/red on realtime balance changes (Convex's useQuery
  // re-renders with the new value automatically) -- skipped on first mount,
  // only fires on an actual change after that.
  useEffect(() => {
    const previous = previousAmount.current;
    previousAmount.current = amount;
    if (previous === amount || !ref.current) return;

    const el = ref.current;
    const increased = amount > previous;
    const flashColor = increased
      ? "var(--color-success)"
      : "var(--color-destructive)";

    withReducedMotion(
      () => {
        gsap
          .timeline()
          .set(el, { color: flashColor })
          .to(el, { color: "", duration: 0.9, ease: "power1.out", clearProps: "color" });
      },
      () => {
        gsap.set(el, { clearProps: "color" });
      },
    );
  }, [amount]);

  return (
    <span ref={ref} className={cn("font-heading tabular-nums", className)}>
      {formatAmount(amount, currency)}
      {showCurrency && <span className="ml-1 text-muted-foreground text-[0.85em]">{currency}</span>}
    </span>
  );
}
