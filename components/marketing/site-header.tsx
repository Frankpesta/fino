"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowUpRight, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { ThemeToggle } from "@/components/theme-toggle";
import { Logo } from "@/components/logo";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { href: "/", label: "Home" }, { href: "/about", label: "About" },
  { href: "/affiliate", label: "Partners" }, { href: "/faqs", label: "FAQs" },
  { href: "/contact", label: "Contact" },
];

// `transparent` remains supported for the homepage API, while every marketing
// route intentionally uses the same forest-glass navigation treatment.
export function SiteHeader({ transparent = false }: { transparent?: boolean }) {
  void transparent;
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return <header className="sticky top-0 z-50 px-3 pt-3 sm:px-5"><div className="mx-auto flex max-w-7xl items-center justify-between gap-4 rounded-2xl border border-white/10 bg-[#173824]/95 px-4 py-3 text-white shadow-[0_12px_35px_rgba(8,31,18,.18)] backdrop-blur-xl sm:px-5">
    <Link href="/" className="flex items-center"><Logo size={76} /></Link>
    <nav className="hidden items-center gap-1 rounded-full border border-white/10 bg-white/[.06] p-1 lg:flex">{NAV_LINKS.map((link) => <Link key={link.href} href={link.href} className={cn("rounded-full px-3 py-1.5 text-sm font-medium transition-colors", pathname === link.href ? "bg-white/14 text-white" : "text-white/65 hover:text-white")}>{link.label}</Link>)}</nav>
    <div className="hidden items-center gap-2 lg:flex"><ThemeToggle /><Link href="/sign-in" className="px-2 text-sm font-medium text-white/70 transition-colors hover:text-white">Sign in</Link><Button className="bg-[#bce6b2] text-[#183725] hover:bg-[#d9f3cf]" render={<Link href="/sign-up">Open account <ArrowUpRight /></Link>} /></div>
    <Button variant="ghost" size="icon" className="text-white hover:bg-white/10 hover:text-white lg:hidden" aria-label="Open menu" onClick={() => setMobileOpen(true)}><Menu className="size-5" /></Button>
  </div>
  <Sheet open={mobileOpen} onOpenChange={setMobileOpen}><SheetContent side="right" className="w-[22rem] max-w-[90vw] border-white/10 bg-[#173824] p-0 text-white" showCloseButton><div className="border-b border-white/10 px-6 py-6"><Link href="/" onClick={() => setMobileOpen(false)} className="flex items-center"><Logo size={76} /></Link><p className="mt-5 text-xs font-semibold uppercase tracking-[.18em] text-white/40">Navigate</p></div><nav className="flex flex-col gap-1 p-4">{NAV_LINKS.map((link) => <Link key={link.href} href={link.href} onClick={() => setMobileOpen(false)} className={cn("rounded-xl px-4 py-3 text-sm font-medium transition-colors", pathname === link.href ? "bg-[#bce6b2] text-[#173824]" : "text-white/70 hover:bg-white/8 hover:text-white")}>{link.label}</Link>)}</nav><div className="mt-auto space-y-3 border-t border-white/10 p-5"><Button variant="outline" className="w-full border-white/15 bg-white/5 text-white hover:bg-white/10 hover:text-white" render={<Link href="/sign-in" onClick={() => setMobileOpen(false)}>Sign in</Link>} /><Button className="w-full bg-[#bce6b2] text-[#173824] hover:bg-[#d9f3cf]" render={<Link href="/sign-up" onClick={() => setMobileOpen(false)}>Open account <ArrowUpRight /></Link>} /></div></SheetContent></Sheet></header>;
}
