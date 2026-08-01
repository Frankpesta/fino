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
  Wallet,
  ChevronsLeft,
  ChevronsRight,
  Sparkles,
  Menu,
  Bell,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useUiStore } from "@/lib/store";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { DashboardFooter } from "@/components/dashboard-footer";
import { SidebarLogout } from "@/components/sidebar-logout";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/plans", label: "Plans", icon: TrendingUp },
  { href: "/deposits", label: "Deposits", icon: ArrowDownToLine },
  { href: "/withdrawals", label: "Withdrawals", icon: ArrowUpFromLine },
  { href: "/referrals", label: "Referrals", icon: Users },
  { href: "/link-wallet", label: "Link Wallet", icon: Wallet },
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
      <nav className="flex-1 space-y-1 overflow-y-auto p-3 pt-7">
        {!collapsedNav && <p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-[.18em] text-white/35">Workspace</p>}
        {NAV_ITEMS.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
                active
                  ? "bg-[#bce6b2] text-[#173824] shadow-[0_10px_24px_rgba(0,0,0,.18)]"
                  : "text-white/55 hover:bg-white/8 hover:pl-4 hover:text-white",
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
    <div className="flex h-screen overflow-hidden bg-background">
      <aside
        className={cn(
          "hidden h-full shrink-0 flex-col border-r border-white/10 bg-[linear-gradient(160deg,#1d442d,#102a1c)] text-ink-foreground transition-[width] duration-200 md:flex",
          collapsed ? "w-16" : "w-60",
        )}
      >
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-white/10 px-4">
          {!collapsed && (
            <Link href="/dashboard" className="flex items-center gap-2 font-heading text-lg font-semibold tracking-tight">
              <span className="flex size-7 items-center justify-center rounded-lg bg-[#bce6b2] text-[#183725]"><Sparkles className="size-3.5" /></span>
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
        <SidebarLogout email={email} collapsed={collapsed} />
      </aside>

      <Sheet open={mobileOpen} onOpenChange={(open) => setMobileOpen(open)}>
        <SheetContent side="left" className="flex flex-col border-white/10 bg-ink p-0 text-ink-foreground">
          <div className="flex h-16 shrink-0 items-center border-b border-white/10 px-4">
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
          <SidebarLogout email={email} collapsed={false} />
        </SheetContent>
      </Sheet>

      <div className="flex h-full min-w-0 flex-1 flex-col overflow-y-auto">
        <header className="sticky top-0 z-20 flex h-[72px] shrink-0 items-center justify-between border-b border-border/70 bg-background/85 px-4 backdrop-blur-xl sm:px-6 lg:px-8">
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
          <div className="hidden md:block"><p className="text-[10px] font-semibold uppercase tracking-[.16em] text-muted-foreground">Secure workspace</p><p className="mt-0.5 text-sm font-medium">Your portfolio</p></div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="hidden rounded-full text-muted-foreground sm:inline-flex" aria-label="Notifications"><Bell className="size-4" /></Button>
            <ThemeToggle />
            <span className="hidden size-8 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary sm:flex">{email?.slice(0, 1).toUpperCase() ?? "F"}</span>
          </div>
        </header>
        <main className="flex-1 bg-[radial-gradient(circle_at_90%_0%,color-mix(in_oklab,var(--primary)_8%,transparent),transparent_25rem)] p-4 sm:p-6 lg:p-8">{children}</main>
        <DashboardFooter />
      </div>
    </div>
  );
}
