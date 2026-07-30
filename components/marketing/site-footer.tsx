import Link from "next/link";
import { ArrowUpRight, Sparkles } from "lucide-react";

const QUICK_LINKS = [
  { href: "/", label: "Home" }, { href: "/about", label: "Our approach" },
  { href: "/affiliate", label: "Partner program" }, { href: "/faqs", label: "FAQs" },
];
const LEGAL_LINKS = [
  { href: "/terms", label: "Terms of service" }, { href: "/privacy", label: "Privacy policy" },
  { href: "/contact", label: "Contact" },
];

export function SiteFooter() {
  return <footer className="border-t border-white/10 bg-ink text-ink-foreground">
    <div className="mx-auto max-w-6xl px-6 py-14">
      <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
        <div className="lg:col-span-2">
          <span className="flex items-center gap-2 font-heading text-xl font-semibold"><span className="flex size-7 items-center justify-center rounded-lg bg-primary text-primary-foreground"><Sparkles className="size-3.5" /></span>Fino</span>
          <p className="mt-4 max-w-sm text-sm leading-6 text-white/55">A considered way to access digital-asset strategies, with clear terms, deliberate review, and an account you can read at a glance.</p>
        </div>
        <FooterList title="Explore" links={QUICK_LINKS} />
        <FooterList title="Trust & legal" links={LEGAL_LINKS} />
      </div>
      <div className="mt-12 flex flex-col gap-2 border-t border-white/10 pt-6 text-xs text-white/40 sm:flex-row sm:items-center sm:justify-between">
        <p>© {new Date().getFullYear()} Fino. All rights reserved.</p>
        <p>Digital-asset investing carries risk. Target rates are not guarantees.</p>
      </div>
    </div>
  </footer>;
}

function FooterList({ title, links }: { title: string; links: { href: string; label: string }[] }) {
  return <div><h3 className="text-sm font-semibold text-white">{title}</h3><ul className="mt-4 space-y-2.5">{links.map((link) => <li key={link.href}><Link href={link.href} className="group flex items-center gap-1 text-sm text-white/55 transition-colors hover:text-white">{link.label}<ArrowUpRight className="size-3 opacity-0 transition-opacity group-hover:opacity-100" /></Link></li>)}</ul></div>;
}
