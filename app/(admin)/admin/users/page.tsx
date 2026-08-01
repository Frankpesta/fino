"use client";

import { useState } from "react";
import Link from "next/link";
import { usePaginatedQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Doc } from "@/convex/_generated/dataModel";
import { Input } from "@/components/ui/input";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
import { PaginationFooter } from "@/components/ui/pagination-footer";
import { Badge } from "@/components/ui/badge";
import { USER_STATUS_STYLES } from "@/components/ui/status-badge";
import { AmountDisplay } from "@/components/ui/amount-display";
import { CURRENCIES, type Currency } from "@/lib/currency";
import { Search } from "lucide-react";

type AdminUser = Doc<"users"> & { referralCount: number };

export default function AdminUsersPage() {
  const [search, setSearch] = useState("");
  const {
    results: users,
    status,
    loadMore,
  } = usePaginatedQuery(
    api.users.listForAdmin,
    { search: search || undefined },
    { initialNumItems: 20 },
  );

  const columns: DataTableColumn<AdminUser>[] = [
    {
      key: "email",
      header: "Email",
      cell: (row) => (
        <Link href={`/admin/users/${row._id}`} className="flex items-center gap-2.5 font-medium hover:underline">
          <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
            {(row.name ?? row.email).slice(0, 1).toUpperCase()}
          </span>
          {row.email}
        </Link>
      ),
    },
    { key: "role", header: "Role", cell: (row) => row.role },
    {
      key: "status",
      header: "Status",
      cell: (row) => (
        <Badge variant="outline" className={USER_STATUS_STYLES[row.status]}>
          {row.status}
        </Badge>
      ),
    },
    {
      key: "balances",
      header: "Non-zero balances",
      cell: (row) => {
        const nonZero = CURRENCIES.filter((c) => row.balances[c] > 0);
        if (nonZero.length === 0) return <span className="text-muted-foreground">—</span>;
        return (
          <div className="flex flex-col gap-0.5">
            {nonZero.map((c) => (
              <AmountDisplay key={c} amount={row.balances[c as Currency]} currency={c} />
            ))}
          </div>
        );
      },
    },
    { key: "referrals", header: "Referrals", cell: (row) => row.referralCount },
    {
      key: "joined",
      header: "Joined",
      cell: (row) => (
        <span className="text-muted-foreground">
          {new Date(row.createdAt).toLocaleDateString()}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight">Users</h1>
        <p className="mt-1 text-sm text-muted-foreground">Every registered account on the platform.</p>
      </div>

      <div className="relative max-w-sm">
        <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search by email or name…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-8"
        />
      </div>

      <DataTable
        columns={columns}
        data={status === "LoadingFirstPage" ? undefined : users}
        emptyState="No users match your search."
        footer={
          <PaginationFooter status={status} loadMore={loadMore} loadedCount={users.length} itemLabel="user" />
        }
      />
    </div>
  );
}
