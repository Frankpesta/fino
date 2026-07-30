"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About Us" },
  { href: "/affiliate", label: "Affiliate" },
  { href: "/faqs", label: "FAQs" },
  { href: "/terms", label: "Terms" },
  { href: "/contact", label: "Contact" },
];

export function SiteHeader({ transparent = false }: { transparent?: boolean }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header
      className={cn(
        "sticky top-0 z-50 border-b",
        transparent
          ? "border-white/10 bg-black/40 backdrop-blur-md"
          : "border-border bg-background/95 backdrop-blur-md",
      )}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-4">
        <Link
          href="/"
          className={cn(
            "flex items-center gap-2 font-heading text-lg font-semibold tracking-tight",
            transparent ? "text-white" : "text-foreground",
          )}
        >
          <span className="flex size-7 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-[0_0_24px_oklch(0.6_0.15_155_/_0.45)]">
            <Sparkles className="size-3.5" />
          </span>
          Fino
        </Link>

        <nav className="hidden items-center gap-6 lg:flex">
          {NAV_LINKS.map((link) => {
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "text-sm font-medium transition-colors",
                  transparent
                    ? active
                      ? "text-white"
                      : "text-white/70 hover:text-white"
                    : active
                      ? "text-foreground"
                      : "text-muted-foreground hover:text-foreground",
                )}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="hidden items-center gap-2 lg:flex">
          <ThemeToggle />
          <Button
            variant="ghost"
            className={transparent ? "text-white hover:bg-white/10 hover:text-white" : undefined}
            render={<Link href="/sign-in">Sign in</Link>}
          />
          <Button render={<Link href="/sign-up">Sign up</Link>} />
        </div>

        <button
          type="button"
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
          onClick={() => setMobileOpen((v) => !v)}
          className={cn(
            "flex size-9 items-center justify-center rounded-lg lg:hidden",
            transparent ? "text-white" : "text-foreground",
          )}
        >
          {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </div>

      {mobileOpen && (
        <div
          className={cn(
            "border-t px-6 py-4 lg:hidden",
            transparent ? "border-white/10 bg-black/90" : "border-border bg-background",
          )}
        >
          <nav className="flex flex-col gap-3">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "text-sm font-medium",
                  transparent ? "text-white/90" : "text-foreground",
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <div className="mt-4 flex items-center gap-2">
            <ThemeToggle />
            <Button
              variant="outline"
              className="flex-1"
              render={<Link href="/sign-in">Sign in</Link>}
            />
            <Button className="flex-1" render={<Link href="/sign-up">Sign up</Link>} />
          </div>
        </div>
      )}
    </header>
  );
}
