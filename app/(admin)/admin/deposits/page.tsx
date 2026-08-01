"use client";

import { useState } from "react";
import { usePaginatedQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Doc } from "@/convex/_generated/dataModel";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
import { PaginationFooter } from "@/components/ui/pagination-footer";
import { StatusBadge } from "@/components/ui/status-badge";
import { AmountDisplay } from "@/components/ui/amount-display";
import { CurrencyIcon } from "@/components/ui/currency-icon";
import { Button } from "@/components/ui/button";
import type { Currency } from "@/lib/currency";
import { DepositReviewDialog } from "@/components/admin/deposit-review-dialog";

type DepositStatus = "pending" | "approved" | "rejected" | "cancelled";
type Deposit = Doc<"deposits"> & { userEmail: string; matchedPlanName: string | null };

const TABS: { value: DepositStatus | "all"; label: string; empty: string }[] = [
  { value: "pending", label: "Pending", empty: "No pending deposits." },
  { value: "approved", label: "Approved", empty: "No approved deposits." },
  { value: "rejected", label: "Rejected", empty: "No rejected deposits." },
  { value: "all", label: "All", empty: "No deposits yet." },
];

export default function AdminDepositsPage() {
  const [tab, setTab] = useState<DepositStatus | "all">("pending");
  const {
    results: deposits,
    status,
    loadMore,
  } = usePaginatedQuery(
    api.deposits.listForAdmin,
    tab === "all" ? {} : { status: tab },
    { initialNumItems: 20 },
  );
  const [reviewing, setReviewing] = useState<Deposit | null>(null);

  const columns: DataTableColumn<Deposit>[] = [
    {
      key: "date",
      header: "Date",
      cell: (row) => (
        <span className="text-muted-foreground">
          {new Date(row.createdAt).toLocaleDateString()}
        </span>
      ),
    },
    { key: "user", header: "User", cell: (row) => row.userEmail },
    {
      key: "currency",
      header: "Currency",
      cell: (row) => (
        <span className="flex items-center gap-2">
          <CurrencyIcon currency={row.currency as Currency} />
          {row.currency}
        </span>
      ),
    },
    {
      key: "amount",
      header: "Amount",
      cell: (row) => <AmountDisplay amount={row.amount} currency={row.currency as Currency} />,
    },
    {
      key: "plan",
      header: "Plan",
      cell: (row) =>
        row.matchedPlanName ?? <span className="text-destructive">unavailable</span>,
    },
    { key: "status", header: "Status", cell: (row) => <StatusBadge status={row.status} /> },
    {
      key: "actions",
      header: "",
      className: "text-right",
      cell: (row) => (
        <Button variant="ghost" size="sm" onClick={() => setReviewing(row)}>
          {row.status === "pending" ? "Review" : "View"}
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight">Deposits</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Review proof of payment before approving -- approval credits the user&apos;s balance and
          immediately starts the matched investment.
        </p>
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as DepositStatus | "all")}>
        <TabsList>
          {TABS.map((t) => (
            <TabsTrigger key={t.value} value={t.value}>
              {t.label}
            </TabsTrigger>
          ))}
        </TabsList>
        {TABS.map((t) => (
          <TabsContent key={t.value} value={t.value}>
            <DataTable
              columns={columns}
              data={status === "LoadingFirstPage" ? undefined : deposits}
              emptyState={t.empty}
              footer={
                <PaginationFooter
                  status={status}
                  loadMore={loadMore}
                  loadedCount={deposits.length}
                  itemLabel="deposit"
                />
              }
            />
          </TabsContent>
        ))}
      </Tabs>

      {reviewing && (
        <DepositReviewDialog
          deposit={reviewing}
          open={!!reviewing}
          onOpenChange={(open) => !open && setReviewing(null)}
        />
      )}
    </div>
  );
}
