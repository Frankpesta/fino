"use client";

import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { StatCard } from "@/components/ui/stat-card";
import { AmountDisplay } from "@/components/ui/amount-display";
import { CurrencyIcon } from "@/components/ui/currency-icon";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { CURRENCIES, type Currency } from "@/lib/currency";
import { ArrowDownToLine, ArrowUpFromLine, TrendingUp } from "lucide-react";

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

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Your balances and activity, straight from the ledger.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Available balances"
          value={
            stats ? (
              <CurrencyBreakdown values={stats.balances} />
            ) : (
              <Skeleton className="h-24 w-full" />
            )
          }
        />
        <StatCard
          label="Active investments"
          value={
            stats ? (
              <>
                <span className="text-2xl">{stats.activeInvestmentCount}</span>
                <div className="mt-3">
                  <CurrencyBreakdown values={stats.activeInvestmentPrincipal} />
                </div>
              </>
            ) : (
              <Skeleton className="h-24 w-full" />
            )
          }
        />
        <StatCard
          label="Total earned"
          icon={<TrendingUp className="size-4" />}
          value={
            stats ? (
              <CurrencyBreakdown values={stats.totalEarned} />
            ) : (
              <Skeleton className="h-24 w-full" />
            )
          }
        />
        <StatCard
          label="Pending requests"
          value={
            stats ? (
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Deposits</span>
                  <span className="font-heading text-lg">{stats.pendingDepositCount}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Withdrawals</span>
                  <span className="font-heading text-lg">{stats.pendingWithdrawalCount}</span>
                </div>
              </div>
            ) : (
              <Skeleton className="h-16 w-full" />
            )
          }
        />
      </div>

      <div className="flex flex-wrap gap-3">
        <Button render={<Link href="/deposits/new"><ArrowDownToLine />Make a deposit</Link>} />
        <Button
          variant="outline"
          render={<Link href="/withdrawals/new"><ArrowUpFromLine />Request withdrawal</Link>}
        />
      </div>

      <Card>
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
