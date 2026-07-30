import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

// Decorative only -- we don't track balance history over time, so this is a
// fixed accent shape (like the icon badge), not a real trend derived from
// data. Purely a visual accent matching the reference dashboard's cards.
function Sparkline() {
  return (
    <svg viewBox="0 0 60 24" className="h-6 w-14 shrink-0 text-success" aria-hidden="true">
      <polyline
        points="0,20 10,14 18,18 26,8 34,12 42,4 50,10 60,2"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function DashboardStatCard({
  icon,
  label,
  value,
  detail,
  className,
}: {
  icon: ReactNode;
  label: string;
  /** Primary figure -- the live USD estimate, shown big. */
  value: ReactNode;
  /** Optional secondary detail below the label, e.g. the exact per-currency breakdown. */
  detail?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col rounded-2xl bg-ink p-5",
        className,
      )}
    >
      <div className="flex items-center justify-between">
        <div className="flex size-11 items-center justify-center rounded-xl bg-success text-success-foreground">
          {icon}
        </div>
        <Sparkline />
      </div>

      <div className="mt-5">
        <div className="font-heading text-2xl font-semibold tabular-nums text-white">{value}</div>
        <p className="mt-1.5 text-sm text-white/70">{label}</p>
        {detail && <div className="mt-3 border-t border-white/10 pt-3">{detail}</div>}
      </div>
    </div>
  );
}
