"use client";

import { type ReactNode, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ArrowDownToLine,
  ArrowUpFromLine,
  Users,
  TrendingUp,
  Settings,
  ChevronsLeft,
  ChevronsRight,
  ShieldCheck,
  Menu,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useUiStore } from "@/lib/store";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { SidebarLogout } from "@/components/sidebar-logout";

const NAV_ITEMS = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/deposits", label: "Deposits", icon: ArrowDownToLine },
  { href: "/admin/withdrawals", label: "Withdrawals", icon: ArrowUpFromLine },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/plans", label: "Plans", icon: TrendingUp },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

export function AdminShell({ email, children }: { email?: string; children: ReactNode }) {
  const collapsed = useUiStore((s) => s.sidebarCollapsed);
  const toggleSidebar = useUiStore((s) => s.toggleSidebar);
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  function isActive(href: string) {
    return href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);
  }

  function renderNav(collapsedNav: boolean, onNavigate?: () => void) {
    return (
      <nav className="flex-1 space-y-1 overflow-y-auto p-3 pt-5">
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
                  : "text-white/55 hover:bg-white/[0.08] hover:text-white",
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
          "hidden h-full shrink-0 flex-col border-r border-white/10 bg-ink text-ink-foreground transition-[width] duration-200 md:flex",
          collapsed ? "w-16" : "w-60",
        )}
      >
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-white/10 px-4">
          {!collapsed && (
            <Link href="/admin" className="flex items-center gap-2 font-heading text-lg font-semibold tracking-tight">
              <span className="flex size-7 items-center justify-center rounded-lg bg-primary text-primary-foreground"><ShieldCheck className="size-3.5" /></span>
              Fino
              <Badge variant="outline" className="border-white/20 bg-white/5 text-[10px] font-normal text-white/75">
                Admin
              </Badge>
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
              href="/admin"
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-2 font-heading text-lg font-semibold tracking-tight"
            >
              <span className="flex size-7 items-center justify-center rounded-lg bg-primary text-primary-foreground"><ShieldCheck className="size-3.5" /></span>
              Fino
              <Badge variant="outline" className="border-white/20 bg-white/5 text-[10px] font-normal text-white/75">
                Admin
              </Badge>
            </Link>
          </div>
          {renderNav(false, () => setMobileOpen(false))}
          <SidebarLogout email={email} collapsed={false} />
        </SheetContent>
      </Sheet>

      <div className="flex h-full min-w-0 flex-1 flex-col overflow-y-auto">
        <header className="sticky top-0 z-20 flex h-16 shrink-0 items-center justify-between border-b bg-background/85 px-4 backdrop-blur-xl sm:px-6">
          <div className="flex items-center gap-2 md:hidden">
            <Button
              variant="ghost"
              size="icon"
              aria-label="Open menu"
              onClick={() => setMobileOpen(true)}
            >
              <Menu className="size-5" />
            </Button>
            <span className="font-heading text-lg font-semibold">Fino Admin</span>
          </div>
          <span className="hidden text-sm text-muted-foreground md:inline">{email}</span>
          <div className="flex items-center gap-2">
            <ThemeToggle />
          </div>
        </header>
        <main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
