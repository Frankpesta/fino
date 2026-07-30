"use client";

import { useParams } from "next/navigation";
import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { AmountDisplay } from "@/components/ui/amount-display";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import type { Currency } from "@/lib/currency";
import { projectedTotalAtTermEnd } from "@/lib/investmentMath";

export default function InvestmentDetailPage() {
  const [now] = useState(() => Date.now());
  const params = useParams<{ investmentId: string }>();
  const data = useQuery(api.investments.getById, {
    investmentId: params.investmentId as Id<"investments">,
  });

  if (data === undefined) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  const { investment, plan, accrualHistory } = data;
  const currency = investment.currency as Currency;
  const progress = Math.min(
    100,
    Math.max(
      0,
      ((now - investment.startedAt) / (investment.endsAt - investment.startedAt)) * 100,
    ),
  );
  const projectedTotal = projectedTotalAtTermEnd(
    investment.principal,
    investment.rate,
    investment.rateInterval,
    Math.round((investment.endsAt - investment.startedAt) / (24 * 60 * 60 * 1000)),
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-semibold tracking-tight">
            {plan?.name ?? "Investment"}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {(investment.rate * 100).toFixed(2)}% target rate /{" "}
            {investment.rateInterval.replace("ly", "")}
          </p>
        </div>
        <StatusBadge status={investment.status} />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Principal</CardTitle>
          </CardHeader>
          <CardContent>
            <AmountDisplay
              amount={investment.principal}
              currency={currency}
              className="text-xl"
            />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total accrued
            </CardTitle>
          </CardHeader>
          <CardContent>
            <AmountDisplay
              amount={investment.totalAccrued}
              currency={currency}
              className="text-xl"
            />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Projected at term end
            </CardTitle>
          </CardHeader>
          <CardContent>
            <AmountDisplay amount={projectedTotal} currency={currency} className="text-xl" />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-medium">Term progress</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Progress value={progress} />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Started {new Date(investment.startedAt).toLocaleDateString()}</span>
            <span>
              {investment.status === "active"
                ? `Ends ${new Date(investment.endsAt).toLocaleDateString()}`
                : `Ended ${new Date(investment.endsAt).toLocaleDateString()}`}
            </span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-medium">Accrual history</CardTitle>
        </CardHeader>
        <CardContent>
          {accrualHistory.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No accrual has posted yet — it ticks daily.
            </p>
          ) : (
            <div className="divide-y">
              {accrualHistory.map((tx) => (
                <div key={tx._id} className="flex items-center justify-between py-2.5 text-sm">
                  <span className="text-muted-foreground">
                    {new Date(tx.createdAt).toLocaleString()}
                  </span>
                  <AmountDisplay amount={tx.amount} currency={currency} />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
