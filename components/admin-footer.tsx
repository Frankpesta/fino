import Link from "next/link";
import { ShieldCheck } from "lucide-react";

export function AdminFooter() {
  return (
    <footer className="mt-auto border-t border-border/70 bg-background/70 px-4 py-5 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-3 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <p className="flex items-center gap-1.5">
          <ShieldCheck className="size-3.5 text-primary" /> Every admin action is recorded in the audit log.
        </p>
        <div className="flex items-center gap-4">
          <Link href="/admin/settings" className="transition-colors hover:text-foreground">
            Settings
          </Link>
          <Link href="/terms" className="transition-colors hover:text-foreground">
            Terms
          </Link>
          <span>© {new Date().getFullYear()} Zypherex</span>
        </div>
      </div>
    </footer>
  );
}
