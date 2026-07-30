import Link from "next/link";
import Image from "next/image";
import { ShieldCheck, ScrollText, Scale, ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SiteHeader } from "@/components/marketing/site-header";
import { SiteFooter } from "@/components/marketing/site-footer";
import { PageHero } from "@/components/marketing/page-hero";
import { MARKETING_IMAGES } from "@/lib/authImages";

const VALUES = [
  { icon: ScrollText, title: "Nothing important stays hidden", description: "Every deposit, investment, payout, and referral reward is recorded against your account." },
  { icon: ShieldCheck, title: "Review before movement", description: "Deposits and withdrawals are reviewed before money changes hands. There is no silent auto-approval." },
  { icon: Scale, title: "Clarity over theatre", description: "Plan rates are targets, not promises. We show the terms that matter and keep the risk visible." },
];

export default function AboutPage() {
  return <div className="flex min-h-screen flex-col"><SiteHeader /><PageHero title="Built for a more legible way to invest." eyebrow="Our point of view" description="Clear terms, deliberate controls, and an experience that keeps the important details in sight." image={MARKETING_IMAGES.about} />
    <main className="flex-1"><section className="mx-auto grid max-w-6xl gap-12 px-6 py-20 lg:grid-cols-[1fr_1.05fr] lg:items-center"><div className="relative aspect-[4/5] overflow-hidden rounded-3xl bg-muted shadow-2xl"><Image src={MARKETING_IMAGES.about} alt="A modern city reflected in glass" fill sizes="(min-width: 1024px) 42vw, 100vw" className="object-cover" /><div className="absolute inset-0 bg-gradient-to-t from-black/45 to-transparent" /><p className="absolute bottom-6 left-6 right-6 text-sm text-white/75">Markets move quickly. Your decision-making should still feel composed.</p></div><div><p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">The Fino standard</p><h2 className="mt-4 font-heading text-4xl font-semibold tracking-tight sm:text-5xl">A product that explains itself.</h2><p className="mt-6 text-lg leading-8 text-muted-foreground">Fino provides access to curated digital-asset investment plans without hiding the mechanics. Terms, target rates, and payout timing are shown before you commit.</p><p className="mt-4 leading-7 text-muted-foreground">Your account is built around a traceable ledger: deposits, investments, payouts, and referral rewards are recorded so your portfolio is easier to understand, not harder.</p><Button className="mt-7" render={<Link href="/sign-up">Open your account <ArrowUpRight /></Link>} /></div></section>
      <section className="border-y border-border bg-muted/40 px-6 py-20"><div className="mx-auto max-w-6xl"><p className="text-center text-xs font-semibold uppercase tracking-[0.22em] text-primary">Our operating principles</p><h2 className="mt-3 text-center font-heading text-3xl font-semibold tracking-tight sm:text-4xl">What we refuse to compromise on.</h2><div className="mt-12 grid gap-5 lg:grid-cols-3">{VALUES.map((value) => <div key={value.title} className="rounded-2xl border border-border bg-card p-7 shadow-sm"><div className="flex size-11 items-center justify-center rounded-xl bg-primary/10"><value.icon className="size-5 text-primary" /></div><h3 className="mt-5 font-heading text-lg font-semibold">{value.title}</h3><p className="mt-3 text-sm leading-6 text-muted-foreground">{value.description}</p></div>)}</div></div></section>
      <section className="mx-auto max-w-3xl px-6 py-20 text-center"><p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">Start with clarity</p><h2 className="mt-3 font-heading text-3xl font-semibold tracking-tight">Know the terms. Then decide.</h2><p className="mt-4 text-muted-foreground">Explore the answers investors ask most, or speak with our team before you open an account.</p><div className="mt-7 flex justify-center gap-3"><Button render={<Link href="/faqs">Explore FAQs</Link>} /><Button variant="outline" render={<Link href="/contact">Contact us</Link>} /></div></section>
    </main><SiteFooter /></div>;
}
