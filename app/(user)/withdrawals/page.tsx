"use client";

import { useState } from "react";
import Link from "next/link";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Doc } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
import { StatusBadge } from "@/components/ui/status-badge";
import { AmountDisplay } from "@/components/ui/amount-display";
import { CurrencyIcon } from "@/components/ui/currency-icon";
import type { Currency } from "@/lib/currency";
import { Plus } from "lucide-react";

type WithdrawalStatus = "pending" | "approved" | "rejected" | "cancelled";
type Withdrawal = Doc<"withdrawals">;

const TABS: { value: WithdrawalStatus | "all"; label: string; empty: string }[] = [
  {
    value: "pending",
    label: "Pending",
    empty: "No pending withdrawals yet.",
  },
  { value: "approved", label: "Approved", empty: "No approved withdrawals yet." },
  { value: "rejected", label: "Rejected", empty: "No rejected withdrawals." },
  { value: "all", label: "All", empty: "No withdrawals yet." },
];

export default function WithdrawalsPage() {
  const [tab, setTab] = useState<WithdrawalStatus | "all">("pending");
  const withdrawals = useQuery(api.withdrawals.listMine, tab === "all" ? {} : { status: tab });
  const cancelWithdrawal = useMutation(api.withdrawals.cancel);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  async function handleCancel(withdrawalId: Withdrawal["_id"]) {
    setCancellingId(withdrawalId);
    try {
      await cancelWithdrawal({ withdrawalId });
    } finally {
      setCancellingId(null);
    }
  }

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
      key: "destination",
      header: "Destination",
      cell: (row) => (
        <span className="font-mono text-xs text-muted-foreground">
          {row.destinationAddress.slice(0, 6)}…{row.destinationAddress.slice(-4)}
        </span>
      ),
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
          {row.status === "approved" && row.payoutTxHash && (
            <p className="font-mono text-xs text-muted-foreground">
              tx: {row.payoutTxHash.slice(0, 10)}…
            </p>
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
          <h1 className="font-heading text-2xl font-semibold tracking-tight">Withdrawals</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Funds are reserved on request and only deducted once an admin approves.
          </p>
        </div>
        <Button render={<Link href="/withdrawals/new"><Plus />Request withdrawal</Link>} />
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
            <DataTable columns={columns} data={withdrawals} emptyState={t.empty} />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
