"use client";

import { useState, useEffect, useRef, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "convex/react";
import QRCode from "qrcode";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CurrencyIcon } from "@/components/ui/currency-icon";
import { CURRENCIES, formatAmount, type Currency } from "@/lib/currency";
import { TriangleAlert, Copy, Check, ArrowLeft } from "lucide-react";

export default function NewDepositPage() {
  const router = useRouter();
  const [step, setStep] = useState<"amount" | "pay">("amount");
  const [currency, setCurrency] = useState<Currency>("USDT");
  const [amountUsd, setAmountUsd] = useState("");

  const parsedAmountUsd = Number(amountUsd);
  const validAmount = Number.isFinite(parsedAmountUsd) && parsedAmountUsd > 0;

  const quote = useQuery(
    api.deposits.quote,
    validAmount ? { amountUsd: parsedAmountUsd, currency } : "skip",
  );
  const activePlans = useQuery(api.investmentPlans.listActive);
  const wallets = useQuery(api.platformWallets.listActive);
  const wallet = wallets?.find((w) => w.currency === currency);

  const canProceed = validAmount && !!quote?.matchedPlan && !!wallet;

  // Ranges shown when nothing matches, so the user can adjust the amount
  // without guessing -- filtered to plans that could ever accept this
  // currency (its own plans, plus any "ANY"-currency plan).
  const eligibleRanges = (activePlans ?? []).filter(
    (p) => p.currency === currency || p.currency === "ANY",
  );

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight">Make a deposit</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Enter the amount you want to deposit — we&apos;ll match it to an investment plan
          automatically.
        </p>
      </div>

      {wallets !== undefined && !wallet && (
        <Alert variant="destructive">
          <TriangleAlert className="size-4" />
          <AlertTitle>No deposit address configured</AlertTitle>
          <AlertDescription>
            {currency} deposits aren&apos;t available yet — pick another asset or contact support.
          </AlertDescription>
        </Alert>
      )}

      {step === "amount" ? (
        <AmountStep
          currency={currency}
          setCurrency={setCurrency}
          amountUsd={amountUsd}
          setAmountUsd={setAmountUsd}
          quote={quote}
          quoteLoading={validAmount && quote === undefined}
          eligibleRanges={eligibleRanges}
          canProceed={canProceed}
          onProceed={() => setStep("pay")}
        />
      ) : (
        wallet &&
        quote?.matchedPlan && (
          <PayStep
            currency={currency}
            amountUsd={parsedAmountUsd}
            cryptoAmount={quote.cryptoAmount}
            planName={quote.matchedPlan.name}
            address={wallet.address}
            network={wallet.network}
            onBack={() => setStep("amount")}
            onSubmitted={() => router.push("/deposits")}
          />
        )
      )}
    </div>
  );
}

function AmountStep({
  currency,
  setCurrency,
  amountUsd,
  setAmountUsd,
  quote,
  quoteLoading,
  eligibleRanges,
  canProceed,
  onProceed,
}: {
  currency: Currency;
  setCurrency: (c: Currency) => void;
  amountUsd: string;
  setAmountUsd: (v: string) => void;
  quote:
    | { quotedRate: number; cryptoAmount: number; matchedPlan: { name: string; rate: number; rateInterval: string; durationDays: number } | null }
    | undefined;
  quoteLoading: boolean;
  eligibleRanges: { name: string; minDepositUsd: number; maxDepositUsd?: number }[];
  canProceed: boolean;
  onProceed: () => void;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-medium">How much do you want to deposit?</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="space-y-2">
          <Label>Coin</Label>
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
          <Label htmlFor="amount-usd">Amount (USD)</Label>
          <div className="relative">
            <span className="pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2 text-muted-foreground">
              $
            </span>
            <Input
              id="amount-usd"
              type="number"
              step="any"
              min="0"
              required
              className="pl-5"
              value={amountUsd}
              onChange={(e) => setAmountUsd(e.target.value)}
            />
          </div>
        </div>

        {amountUsd && (
          <div className="rounded-md border bg-muted/40 p-3 text-sm">
            {quoteLoading ? (
              <p className="text-muted-foreground">Checking live price…</p>
            ) : quote?.matchedPlan ? (
              <div className="space-y-1">
                <p className="text-muted-foreground">
                  ≈{" "}
                  <span className="font-medium text-foreground">
                    {formatAmount(quote.cryptoAmount, currency)} {currency}
                  </span>{" "}
                  at the current rate
                </p>
                <p>
                  Matches <span className="font-medium">{quote.matchedPlan.name}</span> —{" "}
                  {(quote.matchedPlan.rate * 100).toFixed(2)}% /{" "}
                  {quote.matchedPlan.rateInterval.replace("ly", "")}
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="flex items-start gap-1.5 text-destructive">
                  <TriangleAlert className="mt-0.5 size-3.5 shrink-0" />
                  This amount doesn&apos;t match any active plan for {currency}.
                </p>
                {eligibleRanges.length > 0 && (
                  <ul className="space-y-0.5 text-xs text-muted-foreground">
                    {eligibleRanges.map((p) => (
                      <li key={p.name}>
                        {p.name}: ${p.minDepositUsd}
                        {p.maxDepositUsd !== undefined ? ` – $${p.maxDepositUsd}` : "+"}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
        )}

        <Button className="w-full" disabled={!canProceed} onClick={onProceed}>
          Proceed
        </Button>
      </CardContent>
    </Card>
  );
}

function PayStep({
  currency,
  amountUsd,
  cryptoAmount,
  planName,
  address,
  network,
  onBack,
  onSubmitted,
}: {
  currency: Currency;
  amountUsd: number;
  cryptoAmount: number;
  planName: string;
  address: string;
  network: string;
  onBack: () => void;
  onSubmitted: () => void;
}) {
  const createDeposit = useMutation(api.deposits.create);
  const generateUploadUrl = useMutation(api.deposits.generateUploadUrl);

  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [txHash, setTxHash] = useState("");
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const mounted = useRef(true);

  useEffect(() => {
    QRCode.toDataURL(address).then((url) => {
      if (mounted.current) setQrDataUrl(url);
    });
    return () => {
      mounted.current = false;
    };
  }, [address]);

  async function handleCopy() {
    await navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (txHash.trim().length === 0) {
      setError("Transaction hash is required");
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
        amountUsd,
        currency,
        txHash: txHash.trim(),
        proofFileId,
      });
      onSubmitted();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" /> Change amount
        </button>
        <CardTitle className="text-base font-medium">Send your deposit</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="rounded-md border bg-muted/40 p-3 text-sm">
          <p>
            Send{" "}
            <span className="font-medium">
              {formatAmount(cryptoAmount, currency)} {currency}
            </span>{" "}
            ({network}) — this will fund your investment in{" "}
            <span className="font-medium">{planName}</span> once approved.
          </p>
        </div>

        <div className="flex flex-col items-center gap-3">
          {qrDataUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={qrDataUrl}
              alt="QR code for the deposit address"
              className="size-48 rounded-md border bg-white p-2"
            />
          )}
          <div className="flex w-full items-center gap-2">
            <Input value={address} readOnly className="font-mono text-xs" />
            <Button type="button" variant="outline" size="icon" onClick={handleCopy}>
              {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
            </Button>
          </div>
        </div>

        <Button className="w-full" onClick={() => setModalOpen(true)}>
          I&apos;ve made the deposit
        </Button>
      </CardContent>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm your deposit</DialogTitle>
            <DialogDescription>
              Enter the transaction hash for the transfer you just sent.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="txHash">Transaction hash</Label>
              <Input
                id="txHash"
                required
                value={txHash}
                onChange={(e) => setTxHash(e.target.value)}
              />
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

            <DialogFooter>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Submitting..." : "Submit deposit"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
