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
import { Users, ArrowDownToLine, ArrowUpFromLine, ShieldCheck, WalletCards } from "lucide-react";

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
      <div className="relative overflow-hidden rounded-3xl border border-primary/15 bg-[linear-gradient(120deg,oklch(0.2_0.045_155),oklch(0.14_0.025_155))] px-6 py-7 text-white shadow-xl shadow-primary/5 sm:px-8">
        <div className="absolute -right-16 -top-20 size-56 rounded-full bg-primary/30 blur-3xl" />
        <div className="relative flex items-start gap-4">
          <span className="flex size-11 items-center justify-center rounded-2xl bg-white/10 text-primary"><ShieldCheck className="size-5" /></span>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/55">Operations center</p>
            <h1 className="mt-2 font-heading text-3xl font-semibold tracking-tight">Run the platform with confidence.</h1>
            <p className="mt-2 text-sm text-white/65">Review queues, ledger totals, and operational activity at a glance.</p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Link href="/admin/deposits">
          <Card className="overflow-hidden border-primary/10 bg-card shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-lg">
            <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
              <span className="text-sm text-muted-foreground">Pending deposits</span>
              <span className="rounded-xl bg-primary/10 p-2 text-primary"><ArrowDownToLine className="size-4" /></span>
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
          <Card className="overflow-hidden border-primary/10 bg-card shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-lg">
            <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
              <span className="text-sm text-muted-foreground">Pending withdrawals</span>
              <span className="rounded-xl bg-primary/10 p-2 text-primary"><ArrowUpFromLine className="size-4" /></span>
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
          className="border-primary/10 shadow-sm"
          label="Total users"
          icon={<Users className="size-4" />}
          value={
            stats === undefined ? <Skeleton className="h-8 w-12" /> : stats.totalUsers
          }
        />
        <StatCard
          className="border-primary/10 shadow-sm"
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
          className="border-primary/10 shadow-sm"
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
          className="border-primary/10 shadow-sm"
          label="Currently invested"
          icon={<WalletCards className="size-4" />}
          value={
            stats ? (
              <CurrencyBreakdown values={stats.totalInvested} />
            ) : (
              <Skeleton className="h-24 w-full" />
            )
          }
        />
      </div>

      <Card className="overflow-hidden shadow-sm">
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
