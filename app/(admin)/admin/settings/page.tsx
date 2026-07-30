"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { CurrencyIcon } from "@/components/ui/currency-icon";
import { Skeleton } from "@/components/ui/skeleton";
import { CURRENCIES, type Currency } from "@/lib/currency";
import { WalletFormDialog } from "@/components/admin/wallet-form-dialog";

function MinWithdrawalRow({ currency }: { currency: Currency }) {
  const settings = useQuery(api.platformSettings.get);
  const updateMin = useMutation(api.platformSettings.updateMinWithdrawalAmount);
  const [value, setValue] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const displayedValue = value ?? (settings ? String(settings.minWithdrawalAmount[currency]) : "");

  async function handleSave() {
    const parsed = Number(displayedValue);
    if (!Number.isFinite(parsed) || parsed < 0) return;
    await updateMin({ currency, amount: parsed });
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  }

  return (
    <div className="flex items-center gap-3">
      <span className="flex w-16 items-center gap-1.5 text-sm text-muted-foreground">
        <CurrencyIcon currency={currency} />
        {currency}
      </span>
      <Input
        type="number"
        step="any"
        value={displayedValue}
        onChange={(e) => setValue(e.target.value)}
        className="max-w-[140px]"
      />
      <Button size="sm" variant="outline" onClick={handleSave}>
        {saved ? "Saved" : "Save"}
      </Button>
    </div>
  );
}

function ReferralRateSetting() {
  const settings = useQuery(api.platformSettings.get);
  const updateRate = useMutation(api.platformSettings.updateReferralCommissionRateDefault);
  const [value, setValue] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const displayedValue = value ?? (settings ? String(settings.referralCommissionRateDefault * 100) : "");

  async function handleSave() {
    const parsed = Number(displayedValue) / 100;
    if (!Number.isFinite(parsed) || parsed < 0 || parsed > 1) return;
    await updateRate({ rate: parsed });
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  }

  return (
    <div className="flex items-center gap-3">
      <Input
        type="number"
        step="any"
        value={displayedValue}
        onChange={(e) => setValue(e.target.value)}
        className="max-w-[140px]"
      />
      <span className="text-sm text-muted-foreground">%</span>
      <Button size="sm" variant="outline" onClick={handleSave}>
        {saved ? "Saved" : "Save"}
      </Button>
    </div>
  );
}

function SupportContactSetting() {
  const settings = useQuery(api.platformSettings.get);
  const updateContact = useMutation(api.platformSettings.updateSupportContact);
  const [value, setValue] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const displayedValue = value ?? settings?.supportContact ?? "";

  async function handleSave() {
    await updateContact({ supportContact: displayedValue });
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  }

  return (
    <div className="flex items-center gap-3">
      <Input
        value={displayedValue}
        onChange={(e) => setValue(e.target.value)}
        placeholder="support@yourdomain.com"
        className="max-w-xs"
      />
      <Button size="sm" variant="outline" onClick={handleSave}>
        {saved ? "Saved" : "Save"}
      </Button>
    </div>
  );
}

export default function AdminSettingsPage() {
  const wallets = useQuery(api.platformWallets.listAll);
  const [editingCurrency, setEditingCurrency] = useState<Currency | null>(null);

  const walletByCurrency = new Map((wallets ?? []).map((w) => [w.currency, w]));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Platform-wide configuration.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-medium">Receiving wallets</CardTitle>
          <CardDescription>
            Real addresses the platform controls custody of -- shown to users on the deposit
            form. Nothing is pre-filled; a currency with no address configured simply won&apos;t be
            offered for deposits.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {wallets === undefined ? (
            <Skeleton className="h-32 w-full" />
          ) : (
            <div className="divide-y">
              {CURRENCIES.map((currency) => {
                const wallet = walletByCurrency.get(currency);
                return (
                  <div key={currency} className="flex items-center justify-between py-3 text-sm">
                    <div className="flex items-center gap-2">
                      <CurrencyIcon currency={currency} />
                      <span className="font-medium">{currency}</span>
                      {wallet ? (
                        <>
                          <span className="ml-2 font-mono text-xs text-muted-foreground">
                            {wallet.address.slice(0, 10)}…{wallet.address.slice(-6)} (
                            {wallet.network})
                          </span>
                          <Badge variant={wallet.isActive ? "default" : "outline"}>
                            {wallet.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </>
                      ) : (
                        <span className="ml-2 text-xs text-muted-foreground">
                          Not configured
                        </span>
                      )}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditingCurrency(currency)}
                    >
                      {wallet ? "Edit" : "Configure"}
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-medium">Minimum withdrawal amounts</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {CURRENCIES.map((c) => (
            <MinWithdrawalRow key={c} currency={c} />
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-medium">Default referral commission rate</CardTitle>
          <CardDescription>Applied to new referrals unless overridden.</CardDescription>
        </CardHeader>
        <CardContent>
          <ReferralRateSetting />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-medium">Support contact</CardTitle>
          <CardDescription>Shown to users on rejected deposits and withdrawals.</CardDescription>
        </CardHeader>
        <CardContent>
          <SupportContactSetting />
        </CardContent>
      </Card>

      {editingCurrency && (
        <WalletFormDialog
          currency={editingCurrency}
          wallet={walletByCurrency.get(editingCurrency)}
          open={!!editingCurrency}
          onOpenChange={(open) => !open && setEditingCurrency(null)}
        />
      )}
    </div>
  );
}
