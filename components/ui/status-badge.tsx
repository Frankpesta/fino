"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { withReducedMotion } from "@/lib/motion";

export type Status =
  | "pending"
  | "approved"
  | "rejected"
  | "cancelled"
  | "active"
  | "completed";

export const STATUS_STYLES: Record<Status, string> = {
  pending: "bg-warning/15 text-warning-foreground border-warning/30",
  approved: "bg-success/15 text-success-foreground border-success/30",
  active: "bg-success/15 text-success-foreground border-success/30",
  completed: "bg-accent text-accent-foreground border-accent-foreground/20",
  rejected: "bg-destructive/15 text-destructive border-destructive/30",
  cancelled: "bg-muted text-muted-foreground border-border",
};

export const STATUS_LABELS: Record<Status, string> = {
  pending: "Pending",
  approved: "Approved",
  active: "Active",
  completed: "Completed",
  rejected: "Rejected",
  cancelled: "Cancelled",
};

// User account status (active/suspended/banned) is a distinct domain from
// the transaction Status above, but shares the same semantic color mapping.
export const USER_STATUS_STYLES: Record<"active" | "suspended" | "banned", string> = {
  active: "bg-success/15 text-success-foreground border-success/30",
  suspended: "bg-warning/15 text-warning-foreground border-warning/30",
  banned: "bg-destructive/15 text-destructive border-destructive/30",
};

export function StatusBadge({ status, className }: { status: Status; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const previousStatus = useRef(status);

  useEffect(() => {
    const changed = previousStatus.current !== status;
    previousStatus.current = status;
    if (!changed || !ref.current) return;

    const el = ref.current;
    withReducedMotion(
      () => {
        gsap.fromTo(
          el,
          { scale: 0.85, opacity: 0.4 },
          { scale: 1, opacity: 1, duration: 0.35, ease: "back.out(2)" },
        );
      },
      () => {
        gsap.set(el, { scale: 1, opacity: 1 });
      },
    );
  }, [status]);

  return (
    <Badge
      ref={ref}
      variant="outline"
      className={cn("font-medium capitalize", STATUS_STYLES[status], className)}
    >
      {STATUS_LABELS[status]}
    </Badge>
  );
}
