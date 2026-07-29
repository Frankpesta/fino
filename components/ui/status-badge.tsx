import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

export type Status =
  | "pending"
  | "approved"
  | "rejected"
  | "cancelled"
  | "active"
  | "completed";

const STATUS_STYLES: Record<Status, string> = {
  pending: "bg-warning/15 text-warning-foreground border-warning/30",
  approved: "bg-success/15 text-success-foreground border-success/30",
  active: "bg-success/15 text-success-foreground border-success/30",
  completed: "bg-primary/15 text-primary border-primary/30",
  rejected: "bg-destructive/15 text-destructive border-destructive/30",
  cancelled: "bg-muted text-muted-foreground border-border",
};

const STATUS_LABELS: Record<Status, string> = {
  pending: "Pending",
  approved: "Approved",
  active: "Active",
  completed: "Completed",
  rejected: "Rejected",
  cancelled: "Cancelled",
};

export function StatusBadge({ status, className }: { status: Status; className?: string }) {
  return (
    <Badge
      variant="outline"
      className={cn("font-medium capitalize", STATUS_STYLES[status], className)}
    >
      {STATUS_LABELS[status]}
    </Badge>
  );
}
