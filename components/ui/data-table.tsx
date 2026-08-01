"use client";

import type { ReactNode } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export interface DataTableColumn<T> {
  key: string;
  header: string;
  cell: (row: T, index: number) => ReactNode;
  className?: string;
}

/**
 * Generic table shell parameterized by column set + a Convex `useQuery`
 * result. One component reused across every list view (deposits x4,
 * withdrawals x4, etc. -- see docs/03-phase-2-user-dashboard.md 2.4) instead
 * of bespoke tables per view.
 *
 * `data` is passed straight through from `useQuery`: `undefined` while
 * loading (renders skeleton rows), `[]` once loaded with no rows (renders
 * `emptyState`).
 */
export function DataTable<T extends { _id: string }>({
  columns,
  data,
  emptyState,
  footer,
  className,
}: {
  columns: DataTableColumn<T>[];
  data: T[] | undefined;
  emptyState: ReactNode;
  footer?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("overflow-hidden rounded-2xl border border-border/80 bg-card shadow-sm", className)}>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              {columns.map((col) => (
                <TableHead
                  key={col.key}
                  className={cn("bg-muted/40 text-xs font-semibold uppercase tracking-wide text-muted-foreground", col.className)}
                >
                  {col.header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data === undefined ? (
              Array.from({ length: 3 }).map((_, i) => (
                <TableRow key={i}>
                  {columns.map((col) => (
                    <TableCell key={col.key}>
                      <Skeleton className="h-4 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : data.length === 0 ? (
              <TableRow className="hover:bg-transparent">
                <TableCell
                  colSpan={columns.length}
                  className="h-32 text-center text-muted-foreground"
                >
                  {emptyState}
                </TableCell>
              </TableRow>
            ) : (
              data.map((row, index) => (
                <TableRow key={row._id} className="odd:bg-muted/[0.15]">
                  {columns.map((col) => (
                    <TableCell key={col.key} className={cn("py-3", col.className)}>
                      {col.cell(row, index)}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      {footer}
    </div>
  );
}
