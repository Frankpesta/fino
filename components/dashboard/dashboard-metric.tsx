import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function DashboardMetric({
  label,
  value,
  caption,
  icon,
  accent = false,
  className,
}: {
  label: string;
  value: string | number | ReactNode;
  caption: string;
  icon: ReactNode;
  accent?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border p-5",
        accent ? "border-[#bfe2c4]/35 bg-[#193a28] text-[#fbf7ed]" : "border-border/80 bg-card",
        className,
      )}
    >
      <div className="flex items-center justify-between">
        <p className={`text-sm ${accent ? "text-white/55" : "text-muted-foreground"}`}>{label}</p>
        <span
          className={`flex size-9 items-center justify-center rounded-xl ${accent ? "bg-[#aee6ad]/15 text-[#aee6ad]" : "bg-primary/10 text-primary"}`}
        >
          {icon}
        </span>
      </div>
      <div className="mt-6 font-heading text-3xl font-semibold tracking-tight tabular-nums">
        {value}
      </div>
      <p className={`mt-2 text-xs ${accent ? "text-white/55" : "text-muted-foreground"}`}>{caption}</p>
    </div>
  );
}
