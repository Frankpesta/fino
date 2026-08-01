"use client";

import Link from "next/link";
import Image from "next/image";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
  Activity,
  AlertTriangle,
  ArrowUpRight,
  Bot,
  BrainCircuit,
  Clock,
  CircleCheck,
  FileCheck2,
  LayoutDashboard,
  LineChart,
  Lock,
  Scale,
  ScanLine,
  ShieldCheck,
  TrendingUp,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { SiteHeader } from "@/components/marketing/site-header";
import { SiteFooter } from "@/components/marketing/site-footer";
import { TestimonialsSection } from "@/components/marketing/testimonials-section";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { MARKETING_IMAGES } from "@/lib/authImages";

const WHY_FEATURES = [
  { icon: Clock, title: "24/7 Market Monitoring", text: "Our intelligent trading algorithms never sleep. They analyze global market activity around the clock, ensuring potential opportunities are identified as they emerge." },
  { icon: BrainCircuit, title: "Intelligent Decision-Making", text: "Using advanced analytics and machine learning techniques, our AI evaluates price movements, market trends, volatility, and technical indicators to support informed trading decisions." },
  { icon: Scale, title: "Emotion-Free Trading", text: "Fear and greed often lead to costly mistakes. AI follows strategy—not emotion—helping maintain consistency even during volatile market conditions." },
  { icon: Zap, title: "Lightning-Fast Execution", text: "Market opportunities can disappear within seconds. Automated execution enables trades to be placed quickly when strategy conditions are met." },
  { icon: LineChart, title: "Data-Driven Strategies", text: "Our trading models are continuously refined using historical market data and evolving market behavior to improve decision-making over time." },
];

const PROCESS_STEPS = [
  { number: "01", title: "Market Analysis", text: "The AI continuously scans multiple markets and evaluates thousands of signals simultaneously." },
  { number: "02", title: "Opportunity Detection", text: "When predefined conditions align, the system identifies potential trading opportunities based on its analytical models." },
  { number: "03", title: "Automated Execution", text: "Qualified trades are executed according to the configured strategy and risk parameters." },
  { number: "04", title: "Continuous Optimization", text: "Performance data is monitored to evaluate strategy effectiveness and support ongoing improvements." },
];

const BUILT_FOR = [
  { icon: Bot, text: "AI-powered market intelligence" },
  { icon: Zap, text: "Automated trade execution" },
  { icon: ShieldCheck, text: "Risk management tools" },
  { icon: LineChart, text: "Performance reporting" },
  { icon: Lock, text: "Secure account management" },
  { icon: LayoutDashboard, text: "User-friendly dashboard" },
  { icon: Activity, text: "Continuous strategy monitoring" },
  { icon: FileCheck2, text: "Transparent activity tracking" },
];

const SECURITY_FEATURES = [
  { icon: Lock, title: "Data protection", text: "Modern security practices safeguard your information at every layer of the platform." },
  { icon: ScanLine, title: "Operational transparency", text: "Trading activity and account performance are reported clearly, never buried in fine print." },
  { icon: FileCheck2, title: "Clear reporting", text: "Protecting your information and maintaining transparency are central to how we operate." },
];

const FAQS = [
  { question: "Is AI-managed trading fully automated?", answer: "Depending on your chosen strategy and account settings, trading can be fully automated or include user-defined controls and approvals." },
  { question: "Does AI guarantee profits?", answer: "No. All financial markets involve risk, and no trading system—AI-based or otherwise—can guarantee profits or eliminate the possibility of losses." },
  { question: "Can beginners use the platform?", answer: "Yes. Our platform is designed with an intuitive interface and educational resources to help users understand how AI-managed trading works." },
  { question: "How is risk managed?", answer: "Risk management features may include position sizing, stop-loss parameters, exposure limits, and strategy-specific controls, depending on the selected trading approach." },
];

export default function MarketingHomePage() {
  const plans = useQuery(api.investmentPlans.listPublic);
  return <div className="flex min-h-screen flex-col"><SiteHeader transparent /><main className="flex-1">
    <section className="relative isolate overflow-hidden bg-[#173824] text-white">
      <Image src={MARKETING_IMAGES.home} alt="City skyline behind bamboo foliage" fill priority sizes="100vw" className="-z-20 object-cover opacity-25" />
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_82%_35%,rgba(188,230,178,.22),transparent_24rem),linear-gradient(90deg,rgba(12,32,21,.98),rgba(23,56,36,.78),rgba(23,56,36,.40))]" />
      <div className="mx-auto grid max-w-7xl items-center gap-12 px-5 pb-16 pt-14 sm:px-8 sm:pb-20 sm:pt-16 lg:min-h-[620px] lg:grid-cols-[1.15fr_.85fr] lg:pt-20">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[.25em] text-[#bce6b2]">AI-managed trading that works smarter</p>
          <h1 className="mt-6 max-w-4xl font-heading text-5xl font-semibold leading-[1.02] tracking-[-.055em] sm:text-7xl">Trade with the power of artificial intelligence.</h1>
          <p className="mt-7 max-w-xl text-lg leading-8 text-white/65">Experience a new era of investing where advanced AI technology analyzes markets, identifies high-probability opportunities, and executes trades with speed and precision. Our AI-managed trading system removes emotion from decision-making and uses data-driven strategies to help you pursue consistent market performance.</p>
          <p className="mt-4 max-w-xl text-sm font-semibold text-[#bce6b2]">Smarter decisions. Faster execution. Better opportunities.</p>
          <div className="mt-10 flex flex-wrap gap-3">
            <Button size="lg" className="bg-[#bce6b2] text-[#173824] hover:bg-[#d9f3cf]" render={<Link href="/sign-up">Get Started Today <ArrowUpRight /></Link>} />
            <Button size="lg" variant="outline" className="border-white/20 bg-white/5 text-white hover:bg-white/10 hover:text-white" render={<Link href="/about">See how it works</Link>} />
          </div>
          <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-white/45">
            <span className="flex items-center gap-1.5"><Clock className="size-3.5 text-[#bce6b2]" />AI monitors markets 24/7</span>
            <span className="flex items-center gap-1.5"><ScanLine className="size-3.5 text-[#bce6b2]" />Terms shown before commitment</span>
          </div>
        </div>
        <div className="relative lg:justify-self-end">
          <div className="w-full max-w-sm rounded-[2rem] border border-white/15 bg-white/[.08] p-7 shadow-[0_30px_70px_-20px_rgba(0,0,0,.55)] backdrop-blur-xl">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[.2em] text-white/45">Portfolio balance</p>
                <p className="mt-2 font-heading text-4xl font-semibold tracking-tight">$128,420.55</p>
              </div>
              <span className="flex shrink-0 items-center gap-1 rounded-full bg-[#bce6b2]/15 px-2.5 py-1 text-xs font-semibold text-[#bce6b2]"><TrendingUp className="size-3.5" />+4.8%</span>
            </div>
            <div className="mt-7 flex h-16 items-end gap-1.5">
              {[38, 52, 44, 60, 50, 72, 64, 84, 70, 92].map((h, i) => (
                <span key={i} className="flex-1 rounded-full bg-gradient-to-t from-[#bce6b2]/25 to-[#bce6b2]" style={{ height: `${h}%` }} />
              ))}
            </div>
            <div className="mt-7 grid grid-cols-2 gap-4 border-t border-white/10 pt-6">
              <div><p className="text-xs text-white/45">Active plans</p><p className="mt-1 font-heading text-lg font-semibold">3</p></div>
              <div><p className="text-xs text-white/45">Next payout</p><p className="mt-1 font-heading text-lg font-semibold">2d 6h</p></div>
            </div>
          </div>
          <div className="absolute -bottom-6 -left-6 hidden items-center gap-3 rounded-2xl border border-white/15 bg-[#173824] p-4 shadow-[0_20px_45px_-15px_rgba(0,0,0,.6)] sm:flex">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[#bce6b2] text-[#173824]"><Bot className="size-4" /></span>
            <div><p className="text-xs font-semibold">AI-managed</p><p className="text-[11px] text-white/50">Every trade analyzed</p></div>
          </div>
        </div>
      </div>
    </section>

    <section className="mx-auto max-w-7xl px-5 py-24 sm:px-8">
      <div className="max-w-2xl"><p className="text-xs font-semibold uppercase tracking-[.22em] text-primary">Why AI-managed trading</p><h2 className="mt-4 font-heading text-4xl font-semibold leading-[1.08] tracking-[-.045em] sm:text-5xl">Why Choose AI-Managed Trading?</h2><p className="mt-5 text-sm leading-6 text-muted-foreground">Financial markets move every second. Human traders can miss opportunities, react emotionally, or struggle to process massive amounts of market data. Our AI-powered trading technology continuously monitors market conditions, evaluates thousands of data points, and executes trades based on predefined strategies designed for efficiency and discipline.</p></div>
      <div className="mt-12 grid gap-10 lg:grid-cols-2 lg:items-center">
        <div className="relative h-72 overflow-hidden rounded-2xl sm:h-96">
          <Image src={MARKETING_IMAGES.services.crypto} alt="Multiple monitors displaying live market charts" fill sizes="(min-width: 1024px) 45vw, 100vw" className="object-cover" />
        </div>
        <div className="space-y-6">
          {WHY_FEATURES.map(({ icon: Icon, title, text }) => (
            <div key={title} className="flex gap-4">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"><Icon className="size-5" /></span>
              <div><h3 className="font-heading text-base font-semibold">{title}</h3><p className="mt-1.5 text-sm leading-6 text-muted-foreground">{text}</p></div>
            </div>
          ))}
        </div>
      </div>
    </section>

    <section className="border-y border-border/70 bg-muted/45 px-5 py-24 sm:px-8"><div className="mx-auto max-w-7xl"><div className="grid gap-12 lg:grid-cols-[.8fr_1.2fr]"><div><p className="text-xs font-semibold uppercase tracking-[.22em] text-primary">How it works</p><h2 className="mt-4 font-heading text-4xl font-semibold leading-[1.08] tracking-[-.045em]">From analysis to execution.</h2><p className="mt-5 max-w-sm text-sm leading-6 text-muted-foreground">Every trade moves through the same disciplined pipeline—no shortcuts, no guesswork.</p><Button variant="outline" className="mt-7" render={<Link href="/faqs">Read common questions <ArrowUpRight /></Link>} /></div><div className="divide-y divide-border/70">{PROCESS_STEPS.map((step) => <div key={step.number} className="grid gap-4 py-6 sm:grid-cols-[72px_1fr]"><p className="font-heading text-2xl font-semibold text-primary/65">{step.number}</p><div><h3 className="text-lg font-semibold">{step.title}</h3><p className="mt-2 max-w-lg text-sm leading-6 text-muted-foreground">{step.text}</p></div></div>)}</div></div></div></section>

    <section className="bg-[#f0f3eb] px-5 py-24 sm:px-8 dark:bg-[#1a3022]"><div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-3"><div className="lg:col-span-1"><p className="text-xs font-semibold uppercase tracking-[.22em] text-primary">Built for modern investors</p><h2 className="mt-4 font-heading text-4xl font-semibold leading-[1.08] tracking-[-.045em]">Simplified trading, powered by advanced technology.</h2><p className="mt-5 text-sm leading-6 text-muted-foreground">Whether you&apos;re new to investing or an experienced market participant, AI-managed trading helps simplify the process while responding to changing market conditions. Our platform is designed to provide:</p></div><div className="grid gap-4 sm:grid-cols-2 lg:col-span-2">{BUILT_FOR.map(({ icon: Icon, text }) => <div key={text} className="flex items-center gap-3 rounded-2xl border border-border/70 bg-background/75 p-5"><span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"><Icon className="size-5" /></span><p className="text-sm font-medium">{text}</p></div>)}</div></div></section>

    <section className="relative isolate overflow-hidden bg-[#0c2015] px-5 py-24 text-[#fbf7ed] sm:px-8">
      <Image src={MARKETING_IMAGES.services.forex} alt="Forex trading charts across dual monitors" fill sizes="100vw" className="-z-20 object-cover opacity-25" />
      <div className="absolute inset-0 -z-10 bg-gradient-to-r from-[#0c2015] via-[#0c2015]/90 to-[#0c2015]/60" />
      <div className="mx-auto max-w-3xl"><p className="text-xs font-semibold uppercase tracking-[.22em] text-[#bce6b2]">Our technology</p><h2 className="mt-4 font-heading text-4xl font-semibold leading-[1.1] tracking-[-.045em] sm:text-5xl">One unified trading ecosystem.</h2><p className="mt-6 text-lg leading-8 text-white/70">Our AI infrastructure combines market analytics, predictive modeling, statistical analysis, and automated execution into a unified trading ecosystem. By processing large volumes of market data in real time, the platform identifies patterns that would be difficult for manual traders to evaluate consistently.</p></div>
    </section>

    <section className="mx-auto max-w-7xl px-5 py-24 sm:px-8"><div className="max-w-2xl"><p className="text-xs font-semibold uppercase tracking-[.22em] text-primary">Security &amp; transparency</p><h2 className="mt-4 font-heading text-4xl font-semibold leading-[1.08] tracking-[-.045em] sm:text-5xl">Trust, built into every layer.</h2></div><div className="mt-12 grid gap-5 lg:grid-cols-3">{SECURITY_FEATURES.map(({ icon: Icon, title, text }) => <article key={title} className="rounded-2xl border border-border/80 bg-card p-7"><div className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary"><Icon className="size-5" /></div><h3 className="mt-6 font-heading text-lg font-semibold">{title}</h3><p className="mt-3 text-sm leading-6 text-muted-foreground">{text}</p></article>)}</div></section>

    <section className="border-y border-border bg-muted/35 px-5 py-24 sm:px-8"><div className="mx-auto max-w-7xl"><div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end"><div><p className="text-xs font-semibold uppercase tracking-[.22em] text-primary">Available strategies</p><h2 className="mt-4 font-heading text-4xl font-semibold tracking-[-.045em]">Choose a plan with your eyes open.</h2></div><Button variant="outline" render={<Link href="/faqs">How plans work</Link>} /></div><div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">{plans === undefined ? Array.from({ length: 3 }).map((_, index) => <Skeleton key={index} className="h-80 rounded-2xl" />) : plans.length === 0 ? <p className="py-10 text-muted-foreground">New plans are being prepared. Create an account to stay in the loop.</p> : plans.map((plan) => <article key={plan._id} className="flex min-h-80 flex-col rounded-2xl border border-border/80 bg-card p-7"><div className="flex items-start justify-between"><h3 className="font-heading text-xl font-semibold">{plan.name}</h3><span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">{plan.currency}</span></div><p className="mt-3 text-sm leading-6 text-muted-foreground">{plan.description}</p><div className="mt-7 border-y border-border/70 py-5"><p className="font-heading text-4xl font-semibold">{(plan.rate * 100).toFixed(2)}%</p><p className="mt-1 text-xs text-muted-foreground">Target rate / {plan.rateInterval.replace("ly", "")}</p></div><div className="flex items-center justify-between text-sm"><span className="text-muted-foreground">From ${plan.minDepositUsd}</span><span>{plan.durationDays} days</span></div>{plan.features && plan.features.length > 0 && <ul className="mt-5 space-y-1.5 text-sm">{plan.features.map((feature) => <li key={feature} className="flex items-center gap-2"><CircleCheck className="size-3.5 shrink-0 text-primary" />{feature}</li>)}</ul>}<p className="mt-5 flex flex-1 items-end gap-2 text-xs leading-5 text-muted-foreground"><AlertTriangle className="size-3.5 shrink-0 text-primary" />Target rates are not guaranteed.</p><Button className="mt-5 w-full" render={<Link href="/sign-up">Explore this plan</Link>} /></article>)}</div></div></section>

    <TestimonialsSection />

    <section className="mx-auto max-w-3xl px-5 py-24 sm:px-8"><p className="text-center text-xs font-semibold uppercase tracking-[.22em] text-primary">Frequently asked questions</p><h2 className="mt-3 text-center font-heading text-3xl font-semibold tracking-tight">Straight answers before you commit.</h2>
      <Accordion className="mt-10 rounded-2xl border bg-card px-6 shadow-sm" multiple={false}>
        {FAQS.map((faq) => (
          <AccordionItem key={faq.question} value={faq.question}>
            <AccordionTrigger className="text-base">{faq.question}</AccordionTrigger>
            <AccordionContent className="text-muted-foreground">{faq.answer}</AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </section>

    <section className="mx-auto max-w-4xl px-5 py-24 text-center sm:px-8"><p className="text-xs font-semibold uppercase tracking-[.22em] text-primary">Start deliberately</p><h2 className="mt-4 font-heading text-4xl font-semibold tracking-[-.045em]">Ready to Experience Smarter Trading?</h2><p className="mx-auto mt-5 max-w-xl text-muted-foreground">Join investors embracing AI-driven technology to make more informed trading decisions. Discover how intelligent automation can help streamline your trading process while keeping you in control.</p><div className="mt-8 flex flex-wrap items-center justify-center gap-3"><Button size="lg" render={<Link href="/sign-up">Create Your Account <ArrowUpRight /></Link>} /><Button size="lg" variant="outline" render={<Link href="/about">Explore Our Platform</Link>} /></div></section>
  </main><SiteFooter /></div>;
}
