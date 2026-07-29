"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CurrencyIcon } from "@/components/ui/currency-icon";
import { CURRENCIES, type Currency } from "@/lib/currency";
import { TriangleAlert } from "lucide-react";

export default function NewDepositPage() {
  const router = useRouter();
  const wallets = useQuery(api.platformWallets.listActive);
  const createDeposit = useMutation(api.deposits.create);
  const generateUploadUrl = useMutation(api.deposits.generateUploadUrl);

  const [currency, setCurrency] = useState<Currency>("USDT");
  const [amount, setAmount] = useState("");
  const [txHash, setTxHash] = useState("");
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const wallet = wallets?.find((w) => w.currency === currency);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    const parsedAmount = Number(amount);
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      setError("Enter a valid amount");
      return;
    }
    if (!wallet) {
      setError(`No active deposit address configured for ${currency} yet`);
      return;
    }

    setIsSubmitting(true);
    try {
      let proofFileId: Id<"_storage"> | undefined;
      if (proofFile) {
        const uploadUrl = await generateUploadUrl();
        const result = await fetch(uploadUrl, {
          method: "POST",
          headers: { "Content-Type": proofFile.type },
          body: proofFile,
        });
        if (!result.ok) throw new Error("Proof upload failed");
        const { storageId } = (await result.json()) as { storageId: Id<"_storage"> };
        proofFileId = storageId;
      }

      await createDeposit({
        amount: parsedAmount,
        currency,
        txHash: txHash.trim() || undefined,
        proofFileId,
      });
      router.push("/deposits");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight">Make a deposit</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Send funds to the address below, then submit the details for admin review.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-medium">Deposit details</CardTitle>
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
            </div>

            {wallets === undefined ? null : wallet ? (
              <div className="rounded-md border bg-muted/40 p-3">
                <p className="text-xs text-muted-foreground">
                  Send {currency} to this address ({wallet.network})
                </p>
                <p className="mt-1 break-all font-mono text-sm">{wallet.address}</p>
              </div>
            ) : (
              <Alert variant="destructive">
                <TriangleAlert className="size-4" />
                <AlertTitle>No deposit address configured</AlertTitle>
                <AlertDescription>
                  {currency} deposits aren&apos;t available yet — contact support or try another
                  asset.
                </AlertDescription>
              </Alert>
            )}

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
              <Label htmlFor="txHash">Transaction hash (optional)</Label>
              <Input id="txHash" value={txHash} onChange={(e) => setTxHash(e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="proof">Proof of payment (optional)</Label>
              <Input
                id="proof"
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={(e) => setProofFile(e.target.files?.[0] ?? null)}
              />
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <Button type="submit" className="w-full" disabled={isSubmitting || !wallet}>
              {isSubmitting ? "Submitting..." : "Submit deposit"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
