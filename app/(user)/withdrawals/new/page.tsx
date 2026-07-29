"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CurrencyIcon } from "@/components/ui/currency-icon";
import { AmountDisplay } from "@/components/ui/amount-display";
import { CURRENCIES, type Currency } from "@/lib/currency";

export default function NewWithdrawalPage() {
  const router = useRouter();
  const [currency, setCurrency] = useState<Currency>("USDT");
  const available = useQuery(api.withdrawals.getAvailableBalance, { currency });
  const createWithdrawal = useMutation(api.withdrawals.create);

  const [amount, setAmount] = useState("");
  const [destinationAddress, setDestinationAddress] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    const parsedAmount = Number(amount);
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      setError("Enter a valid amount");
      return;
    }
    if (available !== undefined && parsedAmount > available) {
      setError(`Amount exceeds your available balance (${available} ${currency})`);
      return;
    }
    if (destinationAddress.trim().length === 0) {
      setError("Destination address is required");
      return;
    }

    setIsSubmitting(true);
    try {
      await createWithdrawal({
        amount: parsedAmount,
        currency,
        destinationAddress: destinationAddress.trim(),
        note: note.trim() || undefined,
      });
      router.push("/withdrawals");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight">
          Request a withdrawal
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Funds are reserved immediately and deducted once an admin approves your request.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-medium">Withdrawal details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
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
              <p className="text-xs text-muted-foreground">
                Available:{" "}
                {available === undefined ? (
                  "…"
                ) : (
                  <AmountDisplay amount={available} currency={currency} />
                )}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">Amount</Label>
              <Input
                id="amount"
                type="number"
                step="any"
                min="0"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="destination">Destination address</Label>
              <Input
                id="destination"
                required
                value={destinationAddress}
                onChange={(e) => setDestinationAddress(e.target.value)}
                className="font-mono"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="note">Note (optional)</Label>
              <Textarea id="note" value={note} onChange={(e) => setNote(e.target.value)} />
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "Submitting..." : "Submit withdrawal request"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
