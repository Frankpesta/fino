"use client";

import { type ReactNode, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ArrowDownToLine,
  ArrowUpFromLine,
  TrendingUp,
  Users,
  UserCircle,
  ChevronsLeft,
  ChevronsRight,
  Sparkles,
  Menu,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useUiStore } from "@/lib/store";
import { ThemeToggle } from "@/components/theme-toggle";
import { SignOutButton } from "@/components/sign-out-button";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent } from "@/components/ui/sheet";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/plans", label: "Plans", icon: TrendingUp },
  { href: "/deposits", label: "Deposits", icon: ArrowDownToLine },
  { href: "/withdrawals", label: "Withdrawals", icon: ArrowUpFromLine },
  { href: "/referrals", label: "Referrals", icon: Users },
  { href: "/profile", label: "Profile", icon: UserCircle },
];

export function AppShell({ email, children }: { email?: string; children: ReactNode }) {
  const collapsed = useUiStore((s) => s.sidebarCollapsed);
  const toggleSidebar = useUiStore((s) => s.toggleSidebar);
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  function isActive(href: string) {
    return href === "/dashboard"
      ? pathname === "/dashboard" || pathname.startsWith("/dashboard/investments")
      : pathname.startsWith(href);
  }

  function renderNav(collapsedNav: boolean, onNavigate?: () => void) {
    return (
      <nav className="flex-1 space-y-1 p-3 pt-5">
        {NAV_ITEMS.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                  : "text-white/55 hover:bg-white/8 hover:text-white",
                collapsedNav && "justify-center px-0",
              )}
              title={collapsedNav ? item.label : undefined}
            >
              <item.icon className="size-4 shrink-0" />
              {!collapsedNav && item.label}
            </Link>
          );
        })}
      </nav>
    );
  }

  return (
    <div className="flex min-h-screen bg-background">
      <aside
        className={cn(
          "hidden shrink-0 flex-col border-r border-white/10 bg-ink text-ink-foreground transition-[width] duration-200 md:flex",
          collapsed ? "w-16" : "w-60",
        )}
      >
        <div className="flex h-16 items-center justify-between border-b border-white/10 px-4">
          {!collapsed && (
            <Link href="/dashboard" className="flex items-center gap-2 font-heading text-lg font-semibold tracking-tight">
              <span className="flex size-7 items-center justify-center rounded-lg bg-primary text-primary-foreground"><Sparkles className="size-3.5" /></span>
              Fino
            </Link>
          )}
          <Button
            variant="ghost"
            size="icon"
            className={cn("text-white/65 hover:bg-white/10 hover:text-white", collapsed && "mx-auto")}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            onClick={toggleSidebar}
          >
            {collapsed ? <ChevronsRight className="size-4" /> : <ChevronsLeft className="size-4" />}
          </Button>
        </div>

        {renderNav(collapsed)}
      </aside>

      <Sheet open={mobileOpen} onOpenChange={(open) => setMobileOpen(open)}>
        <SheetContent side="left" className="border-white/10 bg-ink p-0 text-ink-foreground">
          <div className="flex h-16 items-center border-b border-white/10 px-4">
            <Link
              href="/dashboard"
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-2 font-heading text-lg font-semibold tracking-tight"
            >
              <span className="flex size-7 items-center justify-center rounded-lg bg-primary text-primary-foreground"><Sparkles className="size-3.5" /></span>
              Fino
            </Link>
          </div>
          {renderNav(false, () => setMobileOpen(false))}
        </SheetContent>
      </Sheet>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 items-center justify-between border-b bg-background/85 px-4 backdrop-blur-xl sm:px-6">
          <div className="flex items-center gap-2 md:hidden">
            <Button
              variant="ghost"
              size="icon"
              aria-label="Open menu"
              onClick={() => setMobileOpen(true)}
            >
              <Menu className="size-5" />
            </Button>
            <span className="font-heading text-lg font-semibold">Fino</span>
          </div>
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
