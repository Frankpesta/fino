"use client";

import { useState } from "react";
import Link from "next/link";
import { useMutation, usePaginatedQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Doc } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
import { PaginationFooter } from "@/components/ui/pagination-footer";
import { StatusBadge } from "@/components/ui/status-badge";
import { AmountDisplay } from "@/components/ui/amount-display";
import { CurrencyIcon } from "@/components/ui/currency-icon";
import type { Currency } from "@/lib/currency";
import { Plus } from "lucide-react";

type DepositStatus = "pending" | "approved" | "rejected" | "cancelled";
type Deposit = Doc<"deposits">;

const TABS: { value: DepositStatus | "all"; label: string; empty: string }[] = [
  { value: "pending", label: "Pending", empty: "No pending deposits yet — make your first deposit." },
  { value: "approved", label: "Approved", empty: "No approved deposits yet." },
  { value: "rejected", label: "Rejected", empty: "No rejected deposits." },
  { value: "all", label: "All", empty: "No deposits yet." },
];

export default function DepositsPage() {
  const [tab, setTab] = useState<DepositStatus | "all">("pending");
  const {
    results: deposits,
    status,
    loadMore,
  } = usePaginatedQuery(
    api.deposits.listMine,
    tab === "all" ? {} : { status: tab },
    { initialNumItems: 20 },
  );
  const cancelDeposit = useMutation(api.deposits.cancel);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  async function handleCancel(depositId: Deposit["_id"]) {
    setCancellingId(depositId);
    try {
      await cancelDeposit({ depositId });
    } finally {
      setCancellingId(null);
    }
  }

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
      key: "status",
      header: "Status",
      cell: (row) => (
        <div className="space-y-1">
          <StatusBadge status={row.status} />
          {row.status === "rejected" && row.rejectionReason && (
            <p className="text-xs text-muted-foreground">{row.rejectionReason}</p>
          )}
        </div>
      ),
    },
    {
      key: "actions",
      header: "",
      className: "text-right",
      cell: (row) =>
        row.status === "pending" ? (
          <Button
            variant="ghost"
            size="sm"
            disabled={cancellingId === row._id}
            onClick={() => handleCancel(row._id)}
          >
            {cancellingId === row._id ? "Cancelling..." : "Cancel"}
          </Button>
        ) : null,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-semibold tracking-tight">Deposits</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Every deposit is reviewed by an admin before it&apos;s credited to your balance.
          </p>
        </div>
        <Button render={<Link href="/deposits/new"><Plus />Make a deposit</Link>} />
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
    </div>
  );
}
