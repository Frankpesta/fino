import Link from "next/link";
import { ShieldCheck } from "lucide-react";

export function DashboardFooter() {
  return (
    <footer className="mt-auto border-t border-border/70 bg-background/70 px-4 py-5 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-[1440px] flex-col gap-3 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <p className="flex items-center gap-1.5"><ShieldCheck className="size-3.5 text-primary" /> Your account activity is recorded in your Zypherex ledger.</p>
        <div className="flex items-center gap-4"><Link href="/terms" className="transition-colors hover:text-foreground">Terms</Link><Link href="/privacy" className="transition-colors hover:text-foreground">Privacy</Link><span>© {new Date().getFullYear()} Zypherex</span></div>
      </div>
    </footer>
  );
}
