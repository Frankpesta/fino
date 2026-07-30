"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/ui/stat-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AmountDisplay } from "@/components/ui/amount-display";
import { CurrencyIcon } from "@/components/ui/currency-icon";
import { Skeleton } from "@/components/ui/skeleton";
import { CURRENCIES, type Currency } from "@/lib/currency";
import { Copy, Check } from "lucide-react";

function CurrencyBreakdown({ values }: { values: Record<Currency, number> }) {
  const nonZero = CURRENCIES.filter((c) => values[c] > 0);
  if (nonZero.length === 0) return <span className="text-muted-foreground">—</span>;
  return (
    <div className="space-y-1">
      {nonZero.map((c) => (
        <div key={c} className="flex items-center gap-1.5 text-sm">
          <CurrencyIcon currency={c} className="size-4 text-[9px]" />
          <AmountDisplay amount={values[c]} currency={c} />
        </div>
      ))}
    </div>
  );
}

export default function ReferralsPage() {
  const info = useQuery(api.referrals.getMyReferralInfo);
  const [copied, setCopied] = useState(false);
  const referralPath = info ? `/sign-up?ref=${info.referralCode}` : "";

  async function handleCopy() {
    if (!referralPath) return;
    await navigator.clipboard.writeText(`${window.location.origin}${referralPath}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight">Referrals</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Share your link. Commission is credited when someone you referred gets a deposit
          approved -- not just for signing up.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-medium">Your referral link</CardTitle>
          </CardHeader>
          <CardContent>
            {info === undefined ? (
              <Skeleton className="h-9 w-full" />
            ) : (
              <div className="flex gap-2">
                <Input value={referralPath} readOnly className="font-mono text-xs" />
                <Button variant="outline" size="icon" onClick={handleCopy}>
                  {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
                </Button>
              </div>
            )}
            <p className="mt-2 text-xs text-muted-foreground">
              Code: <span className="font-mono">{info?.referralCode ?? "…"}</span>
            </p>
          </CardContent>
        </Card>

        <StatCard
          label="Total lifetime commission"
          value={
            info ? (
              <CurrencyBreakdown values={info.totalLifetimeCommission} />
            ) : (
              <Skeleton className="h-16 w-full" />
            )
          }
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-medium">
            Referred users {info ? `(${info.referredUsers.length})` : ""}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {info === undefined ? (
            <Skeleton className="h-32 w-full" />
          ) : info.referredUsers.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No referrals yet — share your link to get started.
            </p>
          ) : (
            <div className="divide-y">
              {info.referredUsers.map((r) => (
                <div key={r.referralId} className="grid gap-2 py-3 text-sm sm:grid-cols-4">
                  <div>
                    <p className="font-medium">{r.maskedEmail}</p>
                    <p className="text-xs text-muted-foreground">
                      Joined {new Date(r.joinedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Their deposits</p>
                    <CurrencyBreakdown values={r.totalDeposited} />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Your commission</p>
                    <CurrencyBreakdown values={r.commissionEarned} />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Rate</p>
                    <p>{(r.commissionRate * 100).toFixed(1)}%</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
