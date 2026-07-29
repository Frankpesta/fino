import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export function StatCard({
  label,
  value,
  icon,
  trend,
  className,
}: {
  label: string;
  value: ReactNode;
  icon?: ReactNode;
  trend?: { value: string; direction: "up" | "down" | "flat" };
  className?: string;
}) {
  return (
    <Card className={cn(className)}>
      <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
        <span className="text-sm text-muted-foreground">{label}</span>
        {icon && <span className="text-muted-foreground">{icon}</span>}
      </CardHeader>
      <CardContent>
        <div className="font-heading text-2xl font-semibold tabular-nums">{value}</div>
        {trend && (
          <p
            className={cn(
              "mt-1 text-xs",
              trend.direction === "up" && "text-success",
              trend.direction === "down" && "text-destructive",
              trend.direction === "flat" && "text-muted-foreground",
            )}
          >
            {trend.value}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
