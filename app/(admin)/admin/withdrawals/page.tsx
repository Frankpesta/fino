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
import { WithdrawalReviewDialog } from "@/components/admin/withdrawal-review-dialog";

type WithdrawalStatus = "pending" | "approved" | "rejected" | "cancelled";
type Withdrawal = Doc<"withdrawals"> & { userEmail: string };

const TABS: { value: WithdrawalStatus | "all"; label: string; empty: string }[] = [
  { value: "pending", label: "Pending", empty: "No pending withdrawals." },
  { value: "approved", label: "Approved", empty: "No approved withdrawals." },
  { value: "rejected", label: "Rejected", empty: "No rejected withdrawals." },
  { value: "all", label: "All", empty: "No withdrawals yet." },
];

export default function AdminWithdrawalsPage() {
  const [tab, setTab] = useState<WithdrawalStatus | "all">("pending");
  const {
    results: withdrawals,
    status,
    loadMore,
  } = usePaginatedQuery(
    api.withdrawals.listForAdmin,
    tab === "all" ? {} : { status: tab },
    { initialNumItems: 20 },
  );
  const [reviewing, setReviewing] = useState<Withdrawal | null>(null);

  const columns: DataTableColumn<Withdrawal>[] = [
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
      key: "payout",
      header: "Payout tx",
      cell: (row) =>
        row.payoutTxHash ? (
          <span className="font-mono text-xs text-muted-foreground">
            {row.payoutTxHash.slice(0, 10)}…
          </span>
        ) : (
          <span className="text-xs text-muted-foreground">—</span>
        ),
    },
    { key: "status", header: "Status", cell: (row) => <StatusBadge status={row.status} /> },
    {
      key: "actions",
      header: "",
      className: "text-right",
      cell: (row) => (
        <Button variant="ghost" size="sm" onClick={() => setReviewing(row)}>
          {row.status === "pending" || row.status === "approved" ? "Review" : "View"}
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight">Withdrawals</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Approval re-checks the user&apos;s current balance and deducts it. Payouts are sent through
          your own custody tooling -- this system only records the tx hash.
        </p>
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as WithdrawalStatus | "all")}>
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
              data={status === "LoadingFirstPage" ? undefined : withdrawals}
              emptyState={t.empty}
              footer={
                <PaginationFooter
                  status={status}
                  loadMore={loadMore}
                  loadedCount={withdrawals.length}
                  itemLabel="withdrawal"
                />
              }
            />
          </TabsContent>
        ))}
      </Tabs>

      {reviewing && (
        <WithdrawalReviewDialog
          withdrawal={reviewing}
          open={!!reviewing}
          onOpenChange={(open) => !open && setReviewing(null)}
        />
      )}
    </div>
  );
}
