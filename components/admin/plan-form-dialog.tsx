"use client";

import { useState, type FormEvent } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Doc } from "@/convex/_generated/dataModel";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CURRENCIES } from "@/lib/currency";

export function PlanFormDialog({
  plan,
  open,
  onOpenChange,
}: {
  plan?: Doc<"investmentPlans">;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const isEdit = !!plan;
  const create = useMutation(api.investmentPlans.create);
  const update = useMutation(api.investmentPlans.update);

  const [name, setName] = useState(plan?.name ?? "");
  const [description, setDescription] = useState(plan?.description ?? "");
  const [currency, setCurrency] = useState(plan?.currency ?? "ANY");
  const [rate, setRate] = useState(plan ? String(plan.rate * 100) : "");
  const [rateInterval, setRateInterval] = useState(plan?.rateInterval ?? "weekly");
  const [durationDays, setDurationDays] = useState(plan ? String(plan.durationDays) : "");
  const [minDepositUsd, setMinDepositUsd] = useState(plan ? String(plan.minDepositUsd) : "");
  const [maxDepositUsd, setMaxDepositUsd] = useState(
    plan?.maxDepositUsd ? String(plan.maxDepositUsd) : "",
  );
  const [payoutStyle, setPayoutStyle] = useState(plan?.payoutStyle ?? "accrual");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    const parsedRate = Number(rate) / 100;
    const parsedDuration = Number(durationDays);
    const parsedMin = Number(minDepositUsd);
    const parsedMax = maxDepositUsd.trim() ? Number(maxDepositUsd) : undefined;

    if (!name.trim() || !description.trim()) {
      setError("Name and description are required");
      return;
    }
    if (!Number.isFinite(parsedRate) || parsedRate <= 0) {
      setError("Enter a valid rate percentage");
      return;
    }
    if (!Number.isFinite(parsedDuration) || parsedDuration <= 0) {
      setError("Enter a valid duration in days");
      return;
    }
    if (!Number.isFinite(parsedMin) || parsedMin <= 0) {
      setError("Enter a valid minimum deposit");
      return;
    }

    setIsSubmitting(true);
    try {
      if (isEdit) {
        await update({
          planId: plan._id,
          name: name.trim(),
          description: description.trim(),
          minDepositUsd: parsedMin,
          maxDepositUsd: parsedMax,
          rate: parsedRate,
        });
      } else {
        await create({
          name: name.trim(),
          description: description.trim(),
          minDepositUsd: parsedMin,
          maxDepositUsd: parsedMax,
          currency: currency as (typeof CURRENCIES)[number] | "ANY",
          rate: parsedRate,
          rateInterval: rateInterval as "daily" | "weekly" | "monthly",
          durationDays: parsedDuration,
          payoutStyle: payoutStyle as "accrual" | "end_of_term",
        });
      }
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit plan" : "New investment plan"}</DialogTitle>
          <DialogDescription>
            Rate changes only affect new investments -- existing investors keep the rate they
            locked in.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="plan-name">Name</Label>
            <Input id="plan-name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="plan-description">Description</Label>
            <Textarea
              id="plan-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          {!isEdit && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Currency</Label>
                <Select value={currency} onValueChange={(v) => v && setCurrency(v)}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ANY">Any</SelectItem>
                    {CURRENCIES.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Rate interval</Label>
                <Select
                  value={rateInterval}
                  onValueChange={(v) => setRateInterval(v as typeof rateInterval)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="plan-rate">Target rate (%)</Label>
              <Input
                id="plan-rate"
                type="number"
                step="any"
                value={rate}
                onChange={(e) => setRate(e.target.value)}
              />
            </div>
            {!isEdit && (
              <div className="space-y-2">
                <Label htmlFor="plan-duration">Duration (days)</Label>
                <Input
                  id="plan-duration"
                  type="number"
                  value={durationDays}
                  onChange={(e) => setDurationDays(e.target.value)}
                />
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="plan-min">Min deposit (USD)</Label>
              <Input
                id="plan-min"
                type="number"
                step="any"
                value={minDepositUsd}
                onChange={(e) => setMinDepositUsd(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="plan-max">Max deposit (USD, optional)</Label>
              <Input
                id="plan-max"
                type="number"
                step="any"
                value={maxDepositUsd}
                onChange={(e) => setMaxDepositUsd(e.target.value)}
              />
            </div>
          </div>

          {!isEdit && (
            <div className="space-y-2">
              <Label>Payout style</Label>
              <Select
                value={payoutStyle}
                onValueChange={(v) => setPayoutStyle(v as typeof payoutStyle)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="accrual">Daily accrual</SelectItem>
                  <SelectItem value="end_of_term">End of term</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {error && <p className="text-sm text-destructive">{error}</p>}

          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : isEdit ? "Save changes" : "Create plan"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
