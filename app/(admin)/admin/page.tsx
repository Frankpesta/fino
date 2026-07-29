"use client";

import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { StatCard } from "@/components/ui/stat-card";
import { AmountDisplay } from "@/components/ui/amount-display";
import { CurrencyIcon } from "@/components/ui/currency-icon";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { CURRENCIES, type Currency } from "@/lib/currency";
import { Users, ArrowDownToLine, ArrowUpFromLine } from "lucide-react";

function CurrencyBreakdown({ values }: { values: Record<Currency, number> }) {
  return (
    <div className="space-y-1.5">
      {CURRENCIES.map((currency) => (
        <div key={currency} className="flex items-center justify-between gap-3 text-sm">
          <span className="flex items-center gap-1.5 text-muted-foreground">
            <CurrencyIcon currency={currency} className="size-4 text-[9px]" />
            {currency}
          </span>
          <AmountDisplay amount={values[currency]} currency={currency} showCurrency={false} />
        </div>
      ))}
    </div>
  );
}

export default function AdminDashboardPage() {
  const stats = useQuery(api.admin.getStats);
  const auditLog = useQuery(api.admin.listAuditLog, { limit: 10 });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight">Admin overview</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Platform-wide stats, straight from the ledger.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-2">
        <Link href="/admin/deposits">
          <Card className="transition-colors hover:border-primary/50">
            <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
              <span className="text-sm text-muted-foreground">Pending deposits</span>
              <ArrowDownToLine className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="font-heading text-3xl font-semibold tabular-nums">
                {stats === undefined ? <Skeleton className="h-8 w-12" /> : stats.pendingDepositCount}
              </div>
              <p className="mt-1 text-xs text-muted-foreground">Needs review</p>
            </CardContent>
          </Card>
        </Link>
        <Link href="/admin/withdrawals">
          <Card className="transition-colors hover:border-primary/50">
            <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
              <span className="text-sm text-muted-foreground">Pending withdrawals</span>
              <ArrowUpFromLine className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="font-heading text-3xl font-semibold tabular-nums">
                {stats === undefined ? (
                  <Skeleton className="h-8 w-12" />
                ) : (
                  stats.pendingWithdrawalCount
                )}
              </div>
              <p className="mt-1 text-xs text-muted-foreground">Needs review</p>
            </CardContent>
          </Card>
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total users"
          icon={<Users className="size-4" />}
          value={
            stats === undefined ? <Skeleton className="h-8 w-12" /> : stats.totalUsers
          }
        />
        <StatCard
          label="Deposited (all time)"
          value={
            stats ? (
              <CurrencyBreakdown values={stats.totalDepositedAllTime} />
            ) : (
              <Skeleton className="h-24 w-full" />
            )
          }
        />
        <StatCard
          label="Withdrawn (all time)"
          value={
            stats ? (
              <CurrencyBreakdown values={stats.totalWithdrawn} />
            ) : (
              <Skeleton className="h-24 w-full" />
            )
          }
        />
        <StatCard
          label="Currently invested"
          value={
            stats ? (
              <CurrencyBreakdown values={stats.totalInvested} />
            ) : (
              <Skeleton className="h-24 w-full" />
            )
          }
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-medium">Recent admin actions</CardTitle>
        </CardHeader>
        <CardContent>
          {auditLog === undefined ? (
            <div className="space-y-3">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : auditLog.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No admin actions logged yet.
            </p>
          ) : (
            <div className="divide-y">
              {auditLog.map((entry) => (
                <div key={entry._id} className="flex items-center justify-between py-3 text-sm">
                  <div>
                    <p className="font-medium">{entry.action.replace(/_/g, " ")}</p>
                    <p className="text-xs text-muted-foreground">
                      {entry.adminEmail} · {new Date(entry.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <span className="text-xs text-muted-foreground">{entry.targetTable}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
