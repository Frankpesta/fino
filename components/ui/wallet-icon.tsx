import { cn } from "@/lib/utils";

// Monogram badges instead of third-party brand marks -- same policy as
// CurrencyIcon (see currency-icon.tsx) to avoid trademark entanglement.
const WALLET_STYLES: Record<string, string> = {
  MetaMask: "bg-[oklch(0.78_0.15_65)] text-[oklch(0.2_0.03_65)]",
  "Trust Wallet": "bg-[oklch(0.62_0.18_255)] text-[oklch(0.95_0.02_255)]",
  "Coinbase Wallet": "bg-[oklch(0.62_0.18_255)] text-[oklch(0.95_0.02_255)]",
  Phantom: "bg-[oklch(0.62_0.2_290)] text-[oklch(0.95_0.02_290)]",
  Rainbow: "bg-[oklch(0.72_0.19_20)] text-[oklch(0.15_0.02_20)]",
  Ledger: "bg-[oklch(0.2_0.01_0)] text-[oklch(0.95_0_0)]",
  Trezor: "bg-[oklch(0.55_0.18_150)] text-[oklch(0.95_0.02_150)]",
  WalletConnect: "bg-[oklch(0.6_0.19_255)] text-[oklch(0.95_0.02_255)]",
  Exodus: "bg-[oklch(0.5_0.18_275)] text-[oklch(0.95_0.02_275)]",
  Zerion: "bg-[oklch(0.55_0.2_290)] text-[oklch(0.95_0.02_290)]",
  imToken: "bg-[oklch(0.62_0.18_220)] text-[oklch(0.95_0.02_220)]",
  SafePal: "bg-[oklch(0.6_0.17_235)] text-[oklch(0.95_0.02_235)]",
};

export function WalletIcon({ name, className }: { name: string; className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        "inline-flex size-10 shrink-0 items-center justify-center rounded-xl text-sm font-heading font-bold",
        WALLET_STYLES[name] ?? "bg-muted text-muted-foreground",
        className,
      )}
    >
      {name.slice(0, 1)}
    </span>
  );
}
