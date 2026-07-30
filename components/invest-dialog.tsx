"use client";

import { useState, type FormEvent } from "react";
import { useMutation, useQuery } from "convex/react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CurrencyIcon } from "@/components/ui/currency-icon";
import { AmountDisplay } from "@/components/ui/amount-display";
import { CURRENCIES, type Currency } from "@/lib/currency";

export function InvestDialog({
  plan,
  open,
  onOpenChange,
  onInvested,
}: {
  plan: Doc<"investmentPlans">;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onInvested: () => void;
}) {
  const isAnyCurrency = plan.currency === "ANY";
  const [currency, setCurrency] = useState<Currency>(
    isAnyCurrency ? "USDT" : (plan.currency as Currency),
  );
  const [amount, setAmount] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const available = useQuery(api.withdrawals.getAvailableBalance, { currency });
  const rates = useQuery(api.exchangeRates.get);
  const rate = rates?.[currency]?.usdRate;
  const invest = useMutation(api.investments.invest);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    const parsedAmount = Number(amount);
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      setError("Enter a valid amount");
      return;
    }
    if (rate) {
      const amountUsd = parsedAmount * rate;
      if (amountUsd < plan.minDepositUsd) {
        setError(`Minimum investment for this plan is $${plan.minDepositUsd}`);
        return;
      }
      if (plan.maxDepositUsd !== undefined && amountUsd > plan.maxDepositUsd) {
        setError(`Maximum investment for this plan is $${plan.maxDepositUsd}`);
        return;
      }
    }
    if (available !== undefined && parsedAmount > available) {
      setError(`Amount exceeds your available balance (${available} ${currency})`);
      return;
    }

    setIsSubmitting(true);
    try {
      await invest({ planId: plan._id, currency, amount: parsedAmount });
      setAmount("");
      onInvested();
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
          <DialogTitle>Invest in {plan.name}</DialogTitle>
          <DialogDescription>
            Target rate {(plan.rate * 100).toFixed(2)}% / {plan.rateInterval.replace("ly", "")} —
            not guaranteed, returns depend on trading performance.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {isAnyCurrency && (
            <div className="space-y-2">
              <Label>Currency</Label>
              <Select value={currency} onValueChange={(v) => setCurrency(v as Currency)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CURRENCIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      <span className="flex items-center gap-2">
                        <CurrencyIcon currency={c} />
                        {c}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="invest-amount">Amount</Label>
            <Input
              id="invest-amount"
              type="number"
              step="any"
              min="0"
              required
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Available:{" "}
              {available === undefined ? (
                "…"
              ) : (
                <AmountDisplay amount={available} currency={currency} />
              )}
              {" · Min $"}
              {plan.minDepositUsd}
              {plan.maxDepositUsd !== undefined && <> · Max ${plan.maxDepositUsd}</>}
            </p>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Investing..." : "Confirm investment"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
