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
import { Switch } from "@/components/ui/switch";
import type { Currency } from "@/lib/currency";

export function WalletFormDialog({
  currency,
  wallet,
  open,
  onOpenChange,
}: {
  currency: Currency;
  wallet?: Doc<"platformWallets">;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const upsert = useMutation(api.platformWallets.upsert);
  const [address, setAddress] = useState(wallet?.address ?? "");
  const [network, setNetwork] = useState(wallet?.network ?? "");
  const [isActive, setIsActive] = useState(wallet?.isActive ?? true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (address.trim().length === 0 || network.trim().length === 0) {
      setError("Address and network are required");
      return;
    }

    setIsSubmitting(true);
    try {
      await upsert({
        currency,
        address: address.trim(),
        network: network.trim(),
        isActive,
      });
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
          <DialogTitle>{currency} receiving address</DialogTitle>
          <DialogDescription>
            This is a real address users will send funds to. Double-check it before saving.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="wallet-address">Address</Label>
            <Input
              id="wallet-address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="font-mono"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="wallet-network">Network</Label>
            <Input
              id="wallet-network"
              value={network}
              onChange={(e) => setNetwork(e.target.value)}
              placeholder="e.g. TRC20, ERC20, BEP20, native"
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="wallet-active">Active (visible to users)</Label>
            <Switch id="wallet-active" checked={isActive} onCheckedChange={setIsActive} />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
