import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

// Convex's reactive pagination is cursor-based and only ever grows forward
// (no "page 2 of N" -- see convex/_generated/ai/guidelines.md), so "load
// more" is the correct UX here rather than a classic numbered pager.
export function PaginationFooter({
  status,
  loadMore,
  loadedCount,
  itemLabel = "item",
  pageSize = 20,
}: {
  status: "LoadingFirstPage" | "CanLoadMore" | "LoadingMore" | "Exhausted";
  loadMore: (numItems: number) => void;
  loadedCount: number;
  itemLabel?: string;
  pageSize?: number;
}) {
  if (status === "LoadingFirstPage" || loadedCount === 0) return null;

  return (
    <div className="flex flex-col items-center gap-3 border-t border-border/70 bg-muted/30 px-4 py-3.5 sm:flex-row sm:justify-between sm:px-6">
      <p className="text-xs text-muted-foreground">
        Showing {loadedCount} {itemLabel}
        {loadedCount === 1 ? "" : "s"}
        {status === "Exhausted" ? " — that's all" : ""}
      </p>
      {status !== "Exhausted" && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={status === "LoadingMore"}
          onClick={() => loadMore(pageSize)}
        >
          {status === "LoadingMore" ? (
            <>
              <Loader2 className="size-3.5 animate-spin" /> Loading…
            </>
          ) : (
            "Load more"
          )}
        </Button>
      )}
    </div>
  );
}
