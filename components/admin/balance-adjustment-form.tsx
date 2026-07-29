"use client";

import { useState, type FormEvent } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
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
import { CurrencyIcon } from "@/components/ui/currency-icon";
import { CURRENCIES, type Currency } from "@/lib/currency";

export function BalanceAdjustmentForm({ userId }: { userId: Id<"users"> }) {
  const adjustBalance = useMutation(api.users.adjustBalance);
  const [currency, setCurrency] = useState<Currency>("USDT");
  const [delta, setDelta] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const parsedDelta = Number(delta);
    if (!Number.isFinite(parsedDelta) || parsedDelta === 0) {
      setError("Enter a non-zero amount (negative to deduct)");
      return;
    }
    if (note.trim().length < 5) {
      setError("A note of at least 5 characters is required");
      return;
    }

    setIsSubmitting(true);
    try {
      await adjustBalance({ userId, currency, delta: parsedDelta, note: note.trim() });
      setSuccess("Balance adjusted.");
      setDelta("");
      setNote("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
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
        <div className="space-y-2">
          <Label htmlFor="delta">Amount (+/-)</Label>
          <Input
            id="delta"
            type="number"
            step="any"
            value={delta}
            onChange={(e) => setDelta(e.target.value)}
            placeholder="e.g. -50 or 50"
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="adjustment-note">Note (required)</Label>
        <Textarea
          id="adjustment-note"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Why is this manual adjustment being made?"
        />
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      {success && <p className="text-sm text-success">{success}</p>}
      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Adjusting..." : "Apply adjustment"}
      </Button>
    </form>
  );
}
