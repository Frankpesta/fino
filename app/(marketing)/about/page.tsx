import Link from "next/link";
import Image from "next/image";
import {
  Award,
  BrainCircuit,
  Clock,
  Eye,
  FileCheck2,
  LayoutDashboard,
  Lightbulb,
  Lock,
  MessageCircle,
  ShieldCheck,
  Zap,
  ArrowUpRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { SiteHeader } from "@/components/marketing/site-header";
import { SiteFooter } from "@/components/marketing/site-footer";
import { PageHero } from "@/components/marketing/page-hero";
import { MARKETING_IMAGES } from "@/lib/authImages";

const VALUES = [
  { icon: Lightbulb, title: "Innovation", description: "We continually improve our technology to adapt to changing market conditions." },
  { icon: Eye, title: "Transparency", description: "You should always understand how the platform operates and have access to clear performance reporting." },
  { icon: ShieldCheck, title: "Security", description: "Protecting user information and maintaining secure systems remain at the center of everything we build." },
  { icon: Award, title: "Excellence", description: "We strive to provide reliable technology, exceptional customer support, and a seamless user experience." },
];

const WHY_US = [
  { icon: BrainCircuit, text: "Advanced AI-powered market analysis" },
  { icon: Zap, text: "Automated trade execution" },
  { icon: Clock, text: "Continuous market monitoring" },
  { icon: ShieldCheck, text: "Intelligent risk management tools" },
  { icon: Lock, text: "Secure platform infrastructure" },
  { icon: FileCheck2, text: "Transparent reporting" },
  { icon: MessageCircle, text: "Dedicated customer support" },
  { icon: LayoutDashboard, text: "User-friendly experience" },
];

export default function AboutPage() {
  return <div className="flex min-h-screen flex-col"><SiteHeader /><PageHero title="Empowering smarter trading through artificial intelligence." eyebrow="Our point of view" description="We believe successful trading should be driven by intelligence, discipline, and innovation — not emotion." image={MARKETING_IMAGES.about} />
    <main className="flex-1">
      <section className="mx-auto grid max-w-6xl gap-12 px-6 py-20 lg:grid-cols-[1fr_1.05fr] lg:items-center"><div className="relative aspect-[4/5] overflow-hidden rounded-3xl bg-muted shadow-2xl"><Image src={MARKETING_IMAGES.about} alt="Candlestick chart tracking live market price action" fill sizes="(min-width: 1024px) 42vw, 100vw" className="object-cover" /><div className="absolute inset-0 bg-gradient-to-t from-black/45 to-transparent" /><p className="absolute bottom-6 left-6 right-6 text-sm text-white/75">Markets move quickly. Your decision-making should still feel composed.</p></div><div><p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">Who we are</p><h2 className="mt-4 font-heading text-4xl font-semibold tracking-tight sm:text-5xl">A smarter way to participate in the markets.</h2><p className="mt-6 text-lg leading-8 text-muted-foreground">At Fino, we make advanced AI-powered trading technology accessible to investors seeking a smarter way to participate in today&apos;s financial markets. By combining artificial intelligence, market analytics, and automated execution, we help users take advantage of opportunities with speed and consistency.</p><p className="mt-4 leading-7 text-muted-foreground">Every day, our systems analyze vast amounts of market data, identify potential trading opportunities, and execute strategies according to predefined parameters — technology designed to operate efficiently in fast-moving markets.</p><Button className="mt-7" render={<Link href="/sign-up">Open your account <ArrowUpRight /></Link>} /></div></section>

      <section className="border-y border-border bg-muted/40 px-6 py-20"><div className="mx-auto grid max-w-6xl gap-6 sm:grid-cols-2"><div className="rounded-2xl border border-border bg-card p-7 shadow-sm"><p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">Our vision</p><p className="mt-4 text-lg leading-7 text-muted-foreground">To become a trusted global leader in AI-managed trading by delivering intelligent, transparent, and innovative investment technology that empowers individuals and businesses.</p></div><div className="rounded-2xl border border-border bg-card p-7 shadow-sm"><p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">Our mission</p><p className="mt-4 text-lg leading-7 text-muted-foreground">To simplify market participation through advanced AI solutions while maintaining transparency, security, and responsible risk management.</p></div></div></section>

      <section className="px-6 py-20"><div className="mx-auto max-w-6xl"><p className="text-center text-xs font-semibold uppercase tracking-[0.22em] text-primary">Our core values</p><h2 className="mt-3 text-center font-heading text-3xl font-semibold tracking-tight sm:text-4xl">What we refuse to compromise on.</h2><div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">{VALUES.map((value) => <div key={value.title} className="rounded-2xl border border-border bg-card p-7 shadow-sm"><div className="flex size-11 items-center justify-center rounded-xl bg-primary/10"><value.icon className="size-5 text-primary" /></div><h3 className="mt-5 font-heading text-lg font-semibold">{value.title}</h3><p className="mt-3 text-sm leading-6 text-muted-foreground">{value.description}</p></div>)}</div></div></section>

      <section className="border-y border-border bg-muted/40 px-6 py-20"><div className="mx-auto max-w-6xl"><p className="text-center text-xs font-semibold uppercase tracking-[0.22em] text-primary">Why investors choose us</p><h2 className="mt-3 text-center font-heading text-3xl font-semibold tracking-tight sm:text-4xl">Built to earn your trust, not just your deposit.</h2><div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{WHY_US.map(({ icon: Icon, text }) => <div key={text} className="flex items-center gap-3 rounded-2xl border border-border bg-card p-5 shadow-sm"><span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"><Icon className="size-5" /></span><p className="text-sm font-medium">{text}</p></div>)}</div></div></section>

      <section className="mx-auto max-w-3xl px-6 py-20 text-center"><p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">Our commitment</p><h2 className="mt-3 font-heading text-3xl font-semibold tracking-tight">Sophisticated technology, honestly presented.</h2><p className="mt-5 leading-7 text-muted-foreground">While no trading strategy can eliminate market risk or guarantee returns, our commitment is to provide sophisticated technology that helps you make more informed, data-driven trading decisions while maintaining full transparency and control. Trading and investing involve significant financial risk — past performance is never indicative of future results, and AI technologies and automated strategies cannot guarantee profits or eliminate the possibility of loss. Evaluate your financial objectives and risk tolerance before participating.</p><div className="mt-7 flex justify-center gap-3"><Button render={<Link href="/faqs">Explore FAQs</Link>} /><Button variant="outline" render={<Link href="/contact">Contact us</Link>} /></div></section>
    </main><SiteFooter /></div>;
}
