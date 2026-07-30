"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge, USER_STATUS_STYLES } from "@/components/ui/status-badge";
import { AmountDisplay } from "@/components/ui/amount-display";
import { BalanceAdjustmentForm } from "@/components/admin/balance-adjustment-form";
import { CURRENCIES, type Currency } from "@/lib/currency";

export default function AdminUserDetailPage() {
  const params = useParams<{ userId: string }>();
  const userId = params.userId as Id<"users">;
  const data = useQuery(api.users.getDetailForAdmin, { userId });
  const setStatus = useMutation(api.users.setStatus);
  const [isChangingStatus, setIsChangingStatus] = useState(false);

  async function handleSetStatus(status: "active" | "suspended" | "banned") {
    setIsChangingStatus(true);
    try {
      await setStatus({ userId, status });
    } finally {
      setIsChangingStatus(false);
    }
  }

  if (data === undefined) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  const { user, transactions, investments, deposits, withdrawals } = data;
  const nonZeroBalances = CURRENCIES.filter((c) => user.balances[c] > 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-semibold tracking-tight">{user.email}</h1>
          <div className="mt-1 flex items-center gap-2">
            <Badge variant="outline" className={USER_STATUS_STYLES[user.status]}>
              {user.status}
            </Badge>
            <Badge variant="outline">{user.role}</Badge>
            <span className="text-xs text-muted-foreground">
              Joined {new Date(user.createdAt).toLocaleDateString()}
            </span>
          </div>
        </div>
        <div className="flex gap-2">
          {user.status !== "active" && (
            <Button
              variant="outline"
              disabled={isChangingStatus}
              onClick={() => handleSetStatus("active")}
            >
              Reactivate
            </Button>
          )}
          {user.status !== "suspended" && (
            <Button
              variant="outline"
              disabled={isChangingStatus}
              onClick={() => handleSetStatus("suspended")}
            >
              Suspend
            </Button>
          )}
          {user.status !== "banned" && (
            <Button
              variant="destructive"
              disabled={isChangingStatus}
              onClick={() => handleSetStatus("banned")}
            >
              Ban
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base font-medium">Balances</CardTitle>
          </CardHeader>
          <CardContent>
            {nonZeroBalances.length === 0 ? (
              <p className="text-sm text-muted-foreground">No balance.</p>
            ) : (
              <div className="space-y-2">
                {nonZeroBalances.map((c) => (
                  <div key={c} className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{c}</span>
                    <AmountDisplay amount={user.balances[c as Currency]} currency={c} />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base font-medium">Manual balance adjustment</CardTitle>
          </CardHeader>
          <CardContent>
            <BalanceAdjustmentForm userId={userId} />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-medium">
            Active investments ({investments.filter((i) => i.status === "active").length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {investments.length === 0 ? (
            <p className="text-sm text-muted-foreground">No investments.</p>
          ) : (
            <div className="divide-y">
              {investments.map((inv) => (
                <div key={inv._id} className="flex items-center justify-between py-2.5 text-sm">
                  <div className="flex items-center gap-2">
                    <AmountDisplay amount={inv.principal} currency={inv.currency as Currency} />
                    <span className="text-xs text-muted-foreground">
                      {(inv.rate * 100).toFixed(2)}% / {inv.rateInterval.replace("ly", "")}
                    </span>
                  </div>
                  <StatusBadge status={inv.status} />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-medium">Deposits ({deposits.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {deposits.length === 0 ? (
              <p className="text-sm text-muted-foreground">No deposits.</p>
            ) : (
              <div className="divide-y">
                {deposits.map((d) => (
                  <div key={d._id} className="flex items-center justify-between py-2.5 text-sm">
                    <AmountDisplay amount={d.amount} currency={d.currency as Currency} />
                    <StatusBadge status={d.status} />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base font-medium">
              Withdrawals ({withdrawals.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {withdrawals.length === 0 ? (
              <p className="text-sm text-muted-foreground">No withdrawals.</p>
            ) : (
              <div className="divide-y">
                {withdrawals.map((w) => (
                  <div key={w._id} className="flex items-center justify-between py-2.5 text-sm">
                    <AmountDisplay amount={w.amount} currency={w.currency as Currency} />
                    <StatusBadge status={w.status} />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-medium">
            Transaction history ({transactions.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <p className="text-sm text-muted-foreground">No transactions yet.</p>
          ) : (
            <div className="divide-y">
              {transactions.map((tx) => (
                <div key={tx._id} className="flex items-center justify-between py-2.5 text-sm">
                  <div>
                    <p className="font-medium capitalize">{tx.type.replace(/_/g, " ")}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(tx.createdAt).toLocaleString()}
                      {tx.note ? ` · ${tx.note}` : ""}
                    </p>
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
