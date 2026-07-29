"use client";

import { type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, ArrowDownToLine, ArrowUpFromLine, ChevronsLeft, ChevronsRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useUiStore } from "@/lib/store";
import { ThemeToggle } from "@/components/theme-toggle";
import { SignOutButton } from "@/components/sign-out-button";
import { Button } from "@/components/ui/button";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/deposits", label: "Deposits", icon: ArrowDownToLine },
  { href: "/withdrawals", label: "Withdrawals", icon: ArrowUpFromLine },
];

export function AppShell({ email, children }: { email?: string; children: ReactNode }) {
  const collapsed = useUiStore((s) => s.sidebarCollapsed);
  const toggleSidebar = useUiStore((s) => s.toggleSidebar);
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen bg-background">
      <aside
        className={cn(
          "hidden shrink-0 flex-col border-r bg-card transition-[width] duration-200 md:flex",
          collapsed ? "w-16" : "w-60",
        )}
      >
        <div className="flex h-14 items-center justify-between border-b px-4">
          {!collapsed && (
            <Link href="/dashboard" className="font-heading text-lg font-semibold">
              Fino
            </Link>
          )}
          <Button
            variant="ghost"
            size="icon"
            className={collapsed ? "mx-auto" : ""}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            onClick={toggleSidebar}
          >
            {collapsed ? <ChevronsRight className="size-4" /> : <ChevronsLeft className="size-4" />}
          </Button>
        </div>

        <nav className="flex-1 space-y-1 p-3">
          {NAV_ITEMS.map((item) => {
            const active = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  active
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  collapsed && "justify-center px-0",
                )}
                title={collapsed ? item.label : undefined}
              >
                <item.icon className="size-4 shrink-0" />
                {!collapsed && item.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 items-center justify-between border-b px-4 sm:px-6">
          <span className="font-heading text-lg font-semibold md:hidden">Fino</span>
          <span className="hidden text-sm text-muted-foreground md:inline">{email}</span>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <SignOutButton />
          </div>
        </header>
        <main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
