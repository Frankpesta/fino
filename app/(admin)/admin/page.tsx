"use client";

import Link from "next/link";
import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { AmountDisplay } from "@/components/ui/amount-display";
import { CurrencyIcon } from "@/components/ui/currency-icon";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { PortfolioTrendChart } from "@/components/dashboard/portfolio-trend-chart";
import { UserGrowthChart } from "@/components/dashboard/user-growth-chart";
import { DashboardMetric } from "@/components/dashboard/dashboard-metric";
import { CURRENCIES, type Currency } from "@/lib/currency";
import {
  Users,
  ArrowDownToLine,
  ArrowUpFromLine,
  ShieldCheck,
  WalletCards,
  CheckCircle2,
  Clock,
} from "lucide-react";

function getDashboardStartTime() {
  return Date.now();
}

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
  const [trendNow] = useState(getDashboardStartTime);
  const stats = useQuery(api.admin.getStats);
  const trend = useQuery(api.admin.getTrend, { now: trendNow });
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

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <DashboardMetric
          accent
          label="Total users"
          icon={<Users className="size-4" />}
          value={stats === undefined ? <Skeleton className="h-9 w-16 bg-white/10" /> : stats.totalUsers}
          caption="Registered accounts"
        />
        <DashboardMetric
          label="Total deposits"
          icon={<ArrowDownToLine className="size-4" />}
          value={stats === undefined ? <Skeleton className="h-9 w-16" /> : stats.totalDepositCount}
          caption="All deposit requests ever submitted"
        />
        <DashboardMetric
          label="Total withdrawals"
          icon={<ArrowUpFromLine className="size-4" />}
          value={stats === undefined ? <Skeleton className="h-9 w-16" /> : stats.totalWithdrawalCount}
          caption="All withdrawal requests ever submitted"
        />
        <DashboardMetric
          label="Currently invested"
          icon={<WalletCards className="size-4" />}
          value={stats ? <CurrencyBreakdown values={stats.totalInvested} /> : <Skeleton className="h-24 w-full" />}
          caption="Principal in active investments"
        />
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Link href="/admin/deposits">
          <DashboardMetric
            label="Pending deposits"
            icon={<Clock className="size-4" />}
            value={stats === undefined ? <Skeleton className="h-9 w-12" /> : stats.pendingDepositCount}
            caption="Needs review"
            className="transition-all hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-lg"
          />
        </Link>
        <Link href="/admin/deposits">
          <DashboardMetric
            label="Approved deposits"
            icon={<CheckCircle2 className="size-4" />}
            value={stats === undefined ? <Skeleton className="h-9 w-12" /> : stats.approvedDepositCount}
            caption="Credited to user balances"
            className="transition-all hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-lg"
          />
        </Link>
        <Link href="/admin/withdrawals">
          <DashboardMetric
            label="Pending withdrawals"
            icon={<Clock className="size-4" />}
            value={stats === undefined ? <Skeleton className="h-9 w-12" /> : stats.pendingWithdrawalCount}
            caption="Needs review"
            className="transition-all hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-lg"
          />
        </Link>
        <Link href="/admin/withdrawals">
          <DashboardMetric
            label="Approved withdrawals"
            icon={<CheckCircle2 className="size-4" />}
            value={stats === undefined ? <Skeleton className="h-9 w-12" /> : stats.approvedWithdrawalCount}
            caption="Paid out to users"
            className="transition-all hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-lg"
          />
        </Link>
      </section>

      <section className="grid gap-3 sm:grid-cols-2">
        <DashboardMetric
          label="Deposited (all time)"
          icon={<ArrowDownToLine className="size-4" />}
          value={stats ? <CurrencyBreakdown values={stats.totalDepositedAllTime} /> : <Skeleton className="h-24 w-full" />}
          caption="Approved deposits, by asset"
        />
        <DashboardMetric
          label="Withdrawn (all time)"
          icon={<ArrowUpFromLine className="size-4" />}
          value={stats ? <CurrencyBreakdown values={stats.totalWithdrawn} /> : <Skeleton className="h-24 w-full" />}
          caption="Approved withdrawals, by asset"
        />
      </section>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <Card className="overflow-hidden border-primary/10 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-3 border-b px-5 py-5 sm:px-6">
            <div>
              <p className="font-heading text-xl font-semibold tracking-tight">Platform cash movement</p>
              <p className="mt-1 text-sm text-muted-foreground">Approved deposits vs. withdrawals · last 30 days</p>
            </div>
            <div className="flex gap-3 text-xs font-medium">
              <span className="flex items-center gap-1.5"><i className="size-2 rounded-full bg-[#62B97C]" /> Deposits</span>
              <span className="flex items-center gap-1.5"><i className="size-2 rounded-full bg-[#D6A057]" /> Withdrawals</span>
            </div>
          </div>
          <CardContent className="px-2 pb-4 pt-3 sm:px-4">
            {trend === undefined ? <Skeleton className="h-64 w-full sm:h-72" /> : <PortfolioTrendChart data={trend} />}
          </CardContent>
        </Card>

        <Card className="overflow-hidden border-primary/10 shadow-sm">
          <div className="border-b px-5 py-5 sm:px-6">
            <p className="font-heading text-xl font-semibold tracking-tight">User growth</p>
            <p className="mt-1 text-sm text-muted-foreground">New signups per day · last 30 days</p>
          </div>
          <CardContent className="px-2 pb-4 pt-3 sm:px-4">
            {trend === undefined ? <Skeleton className="h-64 w-full sm:h-72" /> : <UserGrowthChart data={trend} />}
          </CardContent>
        </Card>
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
