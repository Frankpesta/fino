"use client";

import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { DashboardStatCard } from "@/components/ui/dashboard-stat-card";
import { AmountDisplay } from "@/components/ui/amount-display";
import { CurrencyIcon } from "@/components/ui/currency-icon";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/ui/status-badge";
import { CURRENCIES, type Currency } from "@/lib/currency";
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  TrendingUp,
  Wallet,
  Layers,
  Gift,
} from "lucide-react";

function formatUsd(value: number): string {
  return value.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

// Compact, non-zero-only breakdown with explicit white/70 text -- these
// cards are a fixed-dark surface regardless of the active theme (see
// DashboardStatCard), so text can't rely on theme-aware muted/foreground
// tokens the way the rest of the app does. Shown as the exact per-currency
// detail underneath the USD headline figure, which is a live-rate estimate
// -- this is what's actually stored and moved on the ledger.
function DarkCurrencyBreakdown({ values }: { values: Record<Currency, number> }) {
  const nonZero = CURRENCIES.filter((c) => values[c] !== 0);
  if (nonZero.length === 0) {
    return <span className="text-xs text-white/50">No balance yet</span>;
  }
  return (
    <div className="space-y-0.5">
      {nonZero.map((currency) => (
        <div key={currency} className="flex items-center gap-1.5 text-white/80">
          <AmountDisplay amount={values[currency]} currency={currency} showCurrency={false} />
          <span className="text-xs text-white/50">{currency}</span>
        </div>
      ))}
    </div>
  );
}

const TX_TYPE_LABEL: Record<string, string> = {
  deposit: "Deposit",
  withdrawal: "Withdrawal",
  investment: "Investment",
  payout: "Payout",
  referral_commission: "Referral commission",
  admin_adjustment: "Adjustment",
};

export default function DashboardPage() {
  const stats = useQuery(api.dashboard.getStats);
  const activity = useQuery(api.transactions.listRecent, { limit: 8 });
  const investments = useQuery(api.investments.listMine);
  const activeInvestments = investments?.filter((inv) => inv.status === "active") ?? [];

  return (
    <div className="space-y-8">
      <div className="relative overflow-hidden rounded-3xl border border-primary/15 bg-[linear-gradient(120deg,oklch(0.2_0.045_155),oklch(0.14_0.025_155))] px-6 py-7 text-white shadow-xl shadow-primary/5 sm:px-8">
        <div className="absolute -right-16 -top-20 size-56 rounded-full bg-primary/30 blur-3xl" />
        <div className="relative">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/55">Portfolio overview</p>
          <h1 className="mt-2 font-heading text-3xl font-semibold tracking-tight">Your financial position, clearly.</h1>
          <p className="mt-2 max-w-xl text-sm text-white/65">
            Live balances, investments, and ledger activity in one considered view.
          </p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <DashboardStatCard
          icon={<Wallet className="size-5" />}
          label="Available Balance"
          value={stats ? formatUsd(stats.balancesUsd) : <Skeleton className="h-8 w-24 bg-white/10" />}
          detail={stats && <DarkCurrencyBreakdown values={stats.balances} />}
        />
        <DashboardStatCard
          icon={<Layers className="size-5" />}
          label={`Active Investments${stats ? ` (${stats.activeInvestmentCount})` : ""}`}
          value={
            stats ? (
              formatUsd(stats.activeInvestmentPrincipalUsd)
            ) : (
              <Skeleton className="h-8 w-24 bg-white/10" />
            )
          }
          detail={stats && <DarkCurrencyBreakdown values={stats.activeInvestmentPrincipal} />}
        />
        <DashboardStatCard
          icon={<TrendingUp className="size-5" />}
          label="Total Profits"
          value={stats ? formatUsd(stats.totalEarnedUsd) : <Skeleton className="h-8 w-24 bg-white/10" />}
          detail={stats && <DarkCurrencyBreakdown values={stats.totalEarned} />}
        />
        <DashboardStatCard
          icon={<ArrowDownToLine className="size-5" />}
          label="Total Deposits"
          value={
            stats ? (
              formatUsd(stats.totalApprovedDepositsUsd)
            ) : (
              <Skeleton className="h-8 w-24 bg-white/10" />
            )
          }
          detail={stats && <DarkCurrencyBreakdown values={stats.totalApprovedDeposits} />}
        />
        <DashboardStatCard
          icon={<ArrowUpFromLine className="size-5" />}
          label="Total Withdrawals"
          value={
            stats ? (
              formatUsd(stats.totalApprovedWithdrawalsUsd)
            ) : (
              <Skeleton className="h-8 w-24 bg-white/10" />
            )
          }
          detail={stats && <DarkCurrencyBreakdown values={stats.totalApprovedWithdrawals} />}
        />
        <DashboardStatCard
          icon={<Gift className="size-5" />}
          label="Total Referral Bonus"
          value={
            stats ? (
              formatUsd(stats.totalReferralCommissionUsd)
            ) : (
              <Skeleton className="h-8 w-24 bg-white/10" />
            )
          }
          detail={stats && <DarkCurrencyBreakdown values={stats.totalReferralCommission} />}
        />
      </div>

      <div className="flex flex-wrap items-center gap-3 rounded-2xl border bg-card p-3 shadow-sm">
        <Button render={<Link href="/deposits/new"><ArrowDownToLine />Make a deposit</Link>} />
        <Button
          variant="outline"
          render={<Link href="/withdrawals/new"><ArrowUpFromLine />Request withdrawal</Link>}
        />
        <Button variant="outline" render={<Link href="/dashboard/plans"><TrendingUp />View plans</Link>} />
        {stats && (stats.pendingDepositCount > 0 || stats.pendingWithdrawalCount > 0) && (
          <p className="text-sm text-muted-foreground">
            {stats.pendingDepositCount > 0 &&
              `${stats.pendingDepositCount} deposit${stats.pendingDepositCount === 1 ? "" : "s"}`}
            {stats.pendingDepositCount > 0 && stats.pendingWithdrawalCount > 0 && " and "}
            {stats.pendingWithdrawalCount > 0 &&
              `${stats.pendingWithdrawalCount} withdrawal${stats.pendingWithdrawalCount === 1 ? "" : "s"}`}{" "}
            awaiting review
          </p>
        )}
      </div>

      {activeInvestments.length > 0 && (
        <Card className="overflow-hidden border-primary/10 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-medium">Active investments</CardTitle>
          </CardHeader>
          <CardContent className="divide-y">
            {activeInvestments.map((inv) => (
              <Link
                key={inv._id}
                href={`/dashboard/investments/${inv._id}`}
                className="flex items-center justify-between py-3 text-sm transition-colors hover:bg-muted/40"
              >
                <div className="flex items-center gap-3">
                  <CurrencyIcon currency={inv.currency as Currency} />
                  <div>
                    <p className="font-medium">
                      <AmountDisplay amount={inv.principal} currency={inv.currency as Currency} />
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {(inv.rate * 100).toFixed(2)}% / {inv.rateInterval.replace("ly", "")} · ends{" "}
                      {new Date(inv.endsAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <StatusBadge status={inv.status} />
              </Link>
            ))}
          </CardContent>
        </Card>
      )}

      <Card className="overflow-hidden shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-medium">Recent activity</CardTitle>
        </CardHeader>
        <CardContent>
          {activity === undefined ? (
            <div className="space-y-3">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : activity.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No activity yet — make your first deposit to get started.
            </p>
          ) : (
            <div className="divide-y">
              {activity.map((tx) => (
                <div key={tx._id} className="flex items-center justify-between py-3 text-sm">
                  <div className="flex items-center gap-3">
                    <CurrencyIcon currency={tx.currency as Currency} />
                    <div>
                      <p className="font-medium">{TX_TYPE_LABEL[tx.type] ?? tx.type}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(tx.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <AmountDisplay amount={tx.amount} currency={tx.currency as Currency} />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
