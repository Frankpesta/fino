"use client";

import Link from "next/link";
import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { AmountDisplay } from "@/components/ui/amount-display";
import { CurrencyIcon } from "@/components/ui/currency-icon";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/ui/status-badge";
import { PortfolioTrendChart } from "@/components/dashboard/portfolio-trend-chart";
import { DashboardMetric } from "@/components/dashboard/dashboard-metric";
import { type Currency } from "@/lib/currency";
import {
  ArrowDownLeft,
  ArrowUpRight,
  ChevronRight,
  CircleDollarSign,
  Layers3,
  Plus,
  TrendingUp,
  WalletCards,
} from "lucide-react";

const TX_TYPE_LABEL: Record<string, string> = {
  deposit: "Deposit received", withdrawal: "Withdrawal sent", investment: "Investment opened",
  payout: "Investment payout", referral_commission: "Referral reward", admin_adjustment: "Balance adjustment",
};

function formatUsd(value: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 }).format(value);
}

function getDashboardStartTime() {
  return Date.now();
}

export default function DashboardPage() {
  const [trendNow] = useState(getDashboardStartTime);
  const stats = useQuery(api.dashboard.getStats);
  const trend = useQuery(api.dashboard.getTrend, { now: trendNow });
  const activity = useQuery(api.transactions.listRecent, { limit: 6 });
  const investments = useQuery(api.investments.listMine);
  const activeInvestments = investments?.filter((investment) => investment.status === "active") ?? [];

  return (
    <div className="mx-auto max-w-[1440px] space-y-6 lg:space-y-8">
      <section className="relative overflow-hidden rounded-[2rem] bg-[#173824] px-5 py-7 text-[#fbf7ed] shadow-[0_22px_60px_rgba(17,49,31,.18)] sm:px-8 sm:py-9">
        <div className="pointer-events-none absolute inset-y-0 right-0 w-1/2 opacity-70 [background:radial-gradient(circle_at_80%_15%,rgba(174,230,173,.20),transparent_30%),radial-gradient(circle_at_65%_70%,rgba(214,160,87,.22),transparent_34%)]" />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[.2em] text-[#bce6b2]">Portfolio overview</p>
            <h1 className="mt-3 max-w-xl font-heading text-4xl font-semibold leading-[.98] tracking-tight sm:text-5xl">Your money, moving with purpose.</h1>
            <p className="mt-4 max-w-lg text-sm leading-6 text-white/65">A clear, live view of your available balance, active positions, and recent portfolio activity.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button className="bg-[#bce6b2] text-[#183725] hover:bg-[#d6f2cb]" render={<Link href="/deposits/new"><Plus /> Add funds</Link>} />
            <Button variant="outline" className="border-white/20 bg-white/5 text-white hover:bg-white/10 hover:text-white" render={<Link href="/dashboard/plans">Explore plans <ArrowUpRight /></Link>} />
          </div>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <DashboardMetric accent label="Available to invest" icon={<WalletCards className="size-4" />} value={stats ? formatUsd(stats.balancesUsd) : <Skeleton className="h-9 w-28 bg-white/10" />} caption="Live estimate across your wallets" />
        <DashboardMetric label="In active positions" icon={<Layers3 className="size-4" />} value={stats ? formatUsd(stats.activeInvestmentPrincipalUsd) : <Skeleton className="h-9 w-28" />} caption={stats ? `${stats.activeInvestmentCount} active investment${stats.activeInvestmentCount === 1 ? "" : "s"}` : "Loading positions"} />
        <DashboardMetric label="Portfolio earnings" icon={<TrendingUp className="size-4" />} value={stats ? formatUsd(stats.totalEarnedUsd) : <Skeleton className="h-9 w-28" />} caption="Payouts credited to your ledger" />
        <DashboardMetric label="Referral rewards" icon={<CircleDollarSign className="size-4" />} value={stats ? formatUsd(stats.totalReferralCommissionUsd) : <Skeleton className="h-9 w-28" />} caption="Rewards earned from your network" />
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.65fr)_minmax(300px,.7fr)]">
        <Card className="overflow-hidden border-border/80 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border/70 px-5 py-5 sm:px-6">
            <div><p className="font-heading text-2xl font-semibold tracking-tight">Cash movement</p><p className="mt-1 text-sm text-muted-foreground">Inflow and outflow from your real ledger · last 30 days</p></div>
            <div className="flex gap-3 text-xs font-medium"><span className="flex items-center gap-1.5"><i className="size-2 rounded-full bg-[#62B97C]" /> Inflow</span><span className="flex items-center gap-1.5"><i className="size-2 rounded-full bg-[#D6A057]" /> Outflow</span></div>
          </div>
          <CardContent className="px-2 pb-4 pt-3 sm:px-4">{trend === undefined ? <Skeleton className="h-64 w-full sm:h-72" /> : <PortfolioTrendChart data={trend} />}</CardContent>
        </Card>

        <Card className="border-border/80 bg-card p-5 shadow-sm sm:p-6">
          <div className="flex items-center justify-between"><div><p className="font-heading text-2xl font-semibold tracking-tight">At a glance</p><p className="mt-1 text-sm text-muted-foreground">Your account today</p></div><span className="rounded-xl bg-primary/10 p-2 text-primary"><TrendingUp className="size-4" /></span></div>
          <dl className="mt-6 space-y-4">
            <div className="flex items-center justify-between border-b border-border/60 pb-4"><dt className="text-sm text-muted-foreground">Total deposits</dt><dd className="font-semibold tabular-nums">{stats ? formatUsd(stats.totalApprovedDepositsUsd) : "—"}</dd></div>
            <div className="flex items-center justify-between border-b border-border/60 pb-4"><dt className="text-sm text-muted-foreground">Total withdrawals</dt><dd className="font-semibold tabular-nums">{stats ? formatUsd(stats.totalApprovedWithdrawalsUsd) : "—"}</dd></div>
            <div className="flex items-center justify-between"><dt className="text-sm text-muted-foreground">Awaiting review</dt><dd className="font-semibold">{stats ? `${stats.pendingDepositCount + stats.pendingWithdrawalCount} request${stats.pendingDepositCount + stats.pendingWithdrawalCount === 1 ? "" : "s"}` : "—"}</dd></div>
          </dl>
          <Button variant="outline" className="mt-6 w-full" render={<Link href="/deposits">View deposits <ChevronRight /></Link>} />
        </Card>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <Card className="overflow-hidden border-border/80 shadow-sm"><div className="flex items-center justify-between border-b border-border/70 px-5 py-5 sm:px-6"><div><p className="font-heading text-2xl font-semibold">Active investments</p><p className="mt-1 text-sm text-muted-foreground">Your current positions and terms</p></div><Link href="/dashboard/plans" className="text-sm font-medium text-primary hover:underline">View plans</Link></div><CardContent className="p-0">{activeInvestments.length === 0 ? <div className="px-6 py-10 text-center"><span className="mx-auto flex size-11 items-center justify-center rounded-2xl bg-primary/10 text-primary"><Layers3 className="size-5" /></span><p className="mt-4 font-medium">No active investments yet</p><p className="mt-1 text-sm text-muted-foreground">Explore a plan when you are ready.</p></div> : <div className="divide-y divide-border/65">{activeInvestments.slice(0, 4).map((investment) => <Link key={investment._id} href={`/dashboard/investments/${investment._id}`} className="flex items-center gap-3 px-5 py-4 transition-colors hover:bg-muted/45 sm:px-6"><CurrencyIcon currency={investment.currency as Currency} /><div className="min-w-0 flex-1"><p className="font-medium"><AmountDisplay amount={investment.principal} currency={investment.currency as Currency} /></p><p className="mt-0.5 truncate text-xs text-muted-foreground">{(investment.rate * 100).toFixed(2)}% {investment.rateInterval.replace("ly", "")} · ends {new Date(investment.endsAt).toLocaleDateString()}</p></div><StatusBadge status={investment.status} /><ChevronRight className="size-4 text-muted-foreground" /></Link>)}</div>}</CardContent></Card>
        <Card className="overflow-hidden border-border/80 shadow-sm"><div className="flex items-center justify-between border-b border-border/70 px-5 py-5 sm:px-6"><div><p className="font-heading text-2xl font-semibold">Recent activity</p><p className="mt-1 text-sm text-muted-foreground">The latest updates to your ledger</p></div><Link href="/deposits" className="text-sm font-medium text-primary hover:underline">History</Link></div><CardContent className="p-0">{activity === undefined ? <div className="space-y-4 p-6"><Skeleton className="h-12 w-full" /><Skeleton className="h-12 w-full" /></div> : activity.length === 0 ? <div className="px-6 py-10 text-center text-sm text-muted-foreground">Your account activity will appear here.</div> : <div className="divide-y divide-border/65">{activity.map((transaction) => { const debit = transaction.type === "withdrawal" || transaction.type === "investment"; return <div key={transaction._id} className="flex items-center gap-3 px-5 py-4 sm:px-6"><span className={`flex size-9 items-center justify-center rounded-xl ${debit ? "bg-[#D6A057]/15 text-[#9D6B2C]" : "bg-primary/10 text-primary"}`}>{debit ? <ArrowUpRight className="size-4" /> : <ArrowDownLeft className="size-4" />}</span><div className="min-w-0 flex-1"><p className="font-medium">{TX_TYPE_LABEL[transaction.type] ?? transaction.type}</p><p className="mt-0.5 text-xs text-muted-foreground">{new Date(transaction.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}</p></div><p className="font-semibold tabular-nums"><span className={debit ? "text-muted-foreground" : "text-primary"}>{debit ? "−" : "+"}</span><AmountDisplay amount={transaction.amount} currency={transaction.currency as Currency} showCurrency={false} /> <span className="text-xs text-muted-foreground">{transaction.currency}</span></p></div> })}</div>}</CardContent></Card>
      </section>
    </div>
  );
}
