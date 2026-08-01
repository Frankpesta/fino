"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Doc } from "@/convex/_generated/dataModel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus } from "lucide-react";
import { PlanFormDialog } from "@/components/admin/plan-form-dialog";

type Plan = Doc<"investmentPlans">;

export default function AdminPlansPage() {
  const plans = useQuery(api.investmentPlans.listAll);
  const update = useMutation(api.investmentPlans.update);
  const [editing, setEditing] = useState<Plan | null>(null);
  const [creating, setCreating] = useState(false);

  async function toggleActive(plan: Plan) {
    await update({ planId: plan._id, isActive: !plan.isActive });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-semibold tracking-tight">
            Investment plans
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Rate changes only affect new investments -- existing investors keep their locked rate.
          </p>
        </div>
        <Button onClick={() => setCreating(true)}>
          <Plus />
          New plan
        </Button>
      </div>

      {plans === undefined ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-56 w-full" />
          ))}
        </div>
      ) : plans.length === 0 ? (
        <p className="py-16 text-center text-sm text-muted-foreground">
          No plans yet — create the first one.
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {plans.map((plan) => (
            <Card key={plan._id}>
              <CardHeader className="flex-row items-start justify-between space-y-0">
                <CardTitle className="font-heading text-lg">{plan.name}</CardTitle>
                <Badge variant={plan.isActive ? "default" : "outline"}>
                  {plan.isActive ? "Active" : "Inactive"}
                </Badge>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">{plan.description}</p>
                <p className="font-heading text-2xl font-semibold tabular-nums">
                  {(plan.rate * 100).toFixed(2)}%{" "}
                  <span className="text-sm font-normal text-muted-foreground">
                    / {plan.rateInterval.replace("ly", "")}
                  </span>
                </p>
                <dl className="grid grid-cols-2 gap-y-1 text-xs">
                  <dt className="text-muted-foreground">Currency</dt>
                  <dd>{plan.currency}</dd>
                  <dt className="text-muted-foreground">Min / Max (USD)</dt>
                  <dd>
                    ${plan.minDepositUsd} / {plan.maxDepositUsd ? `$${plan.maxDepositUsd}` : "—"}
                  </dd>
                  <dt className="text-muted-foreground">Duration</dt>
                  <dd>{plan.durationDays}d</dd>
                  <dt className="text-muted-foreground">Payout</dt>
                  <dd>{plan.payoutStyle === "accrual" ? "Daily" : "End of term"}</dd>
                </dl>
                {plan.features && plan.features.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {plan.features.map((feature) => (
                      <Badge key={feature} variant="outline" className="font-normal">
                        {feature}
                      </Badge>
                    ))}
                  </div>
                )}
                <div className="flex gap-2 pt-2">
                  <Button variant="outline" size="sm" onClick={() => setEditing(plan)}>
                    Edit
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => toggleActive(plan)}>
                    {plan.isActive ? "Deactivate" : "Reactivate"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {creating && <PlanFormDialog open={creating} onOpenChange={setCreating} />}
      {editing && (
        <PlanFormDialog
          plan={editing}
          open={!!editing}
          onOpenChange={(open) => !open && setEditing(null)}
        />
      )}
    </div>
  );
}
