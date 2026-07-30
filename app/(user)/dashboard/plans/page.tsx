"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Doc } from "@/convex/_generated/dataModel";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertTriangle } from "lucide-react";
import { InvestDialog } from "@/components/invest-dialog";

export default function PlansPage() {
  const plans = useQuery(api.investmentPlans.listActive);
  const [investingIn, setInvestingIn] = useState<Doc<"investmentPlans"> | null>(null);
  const router = useRouter();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight">Investment plans</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Rates shown are target rates, not guarantees — returns depend on trading performance.
        </p>
      </div>

      {plans === undefined ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-64 w-full" />
          ))}
        </div>
      ) : plans.length === 0 ? (
        <p className="py-16 text-center text-sm text-muted-foreground">
          No investment plans are available yet — check back soon.
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {plans.map((plan) => (
            <Card key={plan._id} className="flex flex-col">
              <CardHeader>
                <CardTitle className="font-heading text-lg">{plan.name}</CardTitle>
                <p className="text-sm text-muted-foreground">{plan.description}</p>
              </CardHeader>
              <CardContent className="flex-1 space-y-3">
                <div>
                  <p className="font-heading text-3xl font-semibold tabular-nums">
                    {(plan.rate * 100).toFixed(2)}%
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Target rate / {plan.rateInterval.replace("ly", "")}
                  </p>
                </div>
                <dl className="grid grid-cols-2 gap-y-1 text-sm">
                  <dt className="text-muted-foreground">Currency</dt>
                  <dd>{plan.currency}</dd>
                  <dt className="text-muted-foreground">Min deposit</dt>
                  <dd>${plan.minDepositUsd}</dd>
                  {plan.maxDepositUsd !== undefined && (
                    <>
                      <dt className="text-muted-foreground">Max deposit</dt>
                      <dd>${plan.maxDepositUsd}</dd>
                    </>
                  )}
                  <dt className="text-muted-foreground">Duration</dt>
                  <dd>{plan.durationDays} days</dd>
                  <dt className="text-muted-foreground">Payout</dt>
                  <dd>{plan.payoutStyle === "accrual" ? "Daily accrual" : "End of term"}</dd>
                </dl>
                <p className="flex items-start gap-1.5 text-xs text-muted-foreground">
                  <AlertTriangle className="mt-0.5 size-3.5 shrink-0" />
                  Returns are not guaranteed and depend on trading performance.
                </p>
              </CardContent>
              <CardFooter>
                <Button className="w-full" onClick={() => setInvestingIn(plan)}>
                  Invest
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {investingIn && (
        <InvestDialog
          plan={investingIn}
          open={!!investingIn}
          onOpenChange={(open) => !open && setInvestingIn(null)}
          onInvested={() => {
            setInvestingIn(null);
            router.push("/dashboard");
          }}
        />
      )}
    </div>
  );
}
