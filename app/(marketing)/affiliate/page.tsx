"use client";

import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
  BarChart3,
  Infinity as InfinityIcon,
  Link2,
  ShieldCheck,
  UserPlus,
  Wallet,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { SiteHeader } from "@/components/marketing/site-header";
import { SiteFooter } from "@/components/marketing/site-footer";
import { PageHero } from "@/components/marketing/page-hero";
import { MARKETING_IMAGES } from "@/lib/authImages";

const STEPS = [
  { icon: UserPlus, title: "Create your account", description: "Sign up for Zypherex — every account automatically comes with its own referral link and code, no separate partner application needed." },
  { icon: Link2, title: "Get your referral link", description: "Find your unique referral link and code on your Referrals page as soon as you're signed in." },
  { icon: Zap, title: "Share it", description: "Send your link through your website, social media, email, or personal network." },
  { icon: Wallet, title: "Earn commissions", description: "Once a referred signup's deposit is approved, a commission is credited straight to your balance — automatically." },
];

const BENEFITS = [
  "Competitive commission structure",
  "Real-time referral tracking",
  "No joining fees",
  "Unlimited referral potential",
  "Commission credited instantly on approval",
  "Secure account dashboard",
];

const WHO = [
  "Financial educators",
  "Content creators",
  "Digital marketers",
  "Investment communities",
  "Business consultants",
  "Entrepreneurs",
  "Website owners",
  "Anyone interested in promoting AI-powered trading solutions",
];

const WHY_JOIN = [
  "No separate registration — your account is your partner account",
  "No technical experience required",
  "Long-term earning opportunities",
  "Transparent commission reporting",
  "Commissions paid directly to your balance",
];

export default function AffiliatePage() {
  const settings = useQuery(api.platformSettings.get);

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <PageHero title="Grow with us. Earn together." eyebrow="Partner program" description="Earn recurring commissions by introducing new users to our AI-managed trading platform." image={MARKETING_IMAGES.affiliate} />

      <main className="flex-1">
        <section className="mx-auto max-w-4xl px-6 py-20">
          <h2 className="font-heading text-2xl font-semibold tracking-tight">
            A reward for thoughtful introductions.
          </h2>
          <p className="mt-4 text-muted-foreground">
            Our partner program is designed for individuals, educators, influencers, communities,
            marketers, and businesses who want to earn recurring commissions by introducing new
            users to our AI-managed trading platform. Whether you have an online audience or a
            professional network, the referral program rewards you for helping others discover
            smarter trading technology.
          </p>
          <p className="mt-4 text-muted-foreground">
            Commission is accrued automatically the moment one of your referrals&apos; deposits is
            approved — not just for signing up. It&apos;s credited directly to your account
            balance, where you can withdraw it or use it toward your own investment. To become a
            partner and start earning, you don&apos;t even need an active investment of your own.
          </p>

          <div className="mt-8 rounded-3xl border border-primary/15 bg-[linear-gradient(135deg,var(--card),var(--accent))] p-7 shadow-sm">
            <p className="text-sm text-muted-foreground">Current referral commission rate</p>
            {settings === undefined ? (
              <Skeleton className="mt-2 h-9 w-24" />
            ) : settings.referralCommissionRateDefault > 0 ? (
              <p className="mt-1 font-heading text-3xl font-semibold tabular-nums">
                {(settings.referralCommissionRateDefault * 100).toFixed(1)}%
              </p>
            ) : (
              <p className="mt-1 text-sm text-muted-foreground">
                Set per account — sign up or{" "}
                <Link href="/contact" className="text-primary hover:underline">
                  contact us
                </Link>{" "}
                for the current rate.
              </p>
            )}
          </div>
        </section>

        <section className="border-y border-border bg-muted/40 px-6 py-20">
          <div className="mx-auto max-w-6xl">
            <h2 className="text-center font-heading text-2xl font-semibold tracking-tight">
              How it works
            </h2>
            <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {STEPS.map((step, i) => (
                <div key={step.title} className="rounded-2xl border border-border bg-card p-7 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="flex size-9 items-center justify-center rounded-full bg-accent text-sm font-semibold text-accent-foreground">
                      {i + 1}
                    </div>
                    <step.icon className="size-5 text-primary" />
                  </div>
                  <h3 className="mt-4 font-heading text-base font-semibold">{step.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{step.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-6 py-20">
          <div className="grid gap-12 lg:grid-cols-2">
            <div>
              <h2 className="font-heading text-2xl font-semibold tracking-tight">Partner benefits</h2>
              <ul className="mt-6 space-y-3">
                {BENEFITS.map((benefit) => (
                  <li key={benefit} className="flex items-start gap-3 text-sm">
                    <ShieldCheck className="mt-0.5 size-4 shrink-0 text-primary" />
                    <span className="text-muted-foreground">{benefit}</span>
                  </li>
                ))}
              </ul>
              <h2 className="mt-10 font-heading text-2xl font-semibold tracking-tight">Why join our program?</h2>
              <ul className="mt-6 space-y-3">
                {WHY_JOIN.map((reason) => (
                  <li key={reason} className="flex items-start gap-3 text-sm">
                    <InfinityIcon className="mt-0.5 size-4 shrink-0 text-primary" />
                    <span className="text-muted-foreground">{reason}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h2 className="font-heading text-2xl font-semibold tracking-tight">Who can become a partner?</h2>
              <p className="mt-3 text-sm text-muted-foreground">
                Our referral program is open to anyone with a Zypherex account, including:
              </p>
              <ul className="mt-6 grid gap-3 sm:grid-cols-2">
                {WHO.map((who) => (
                  <li key={who} className="flex items-start gap-3 text-sm">
                    <BarChart3 className="mt-0.5 size-4 shrink-0 text-primary" />
                    <span className="text-muted-foreground">{who}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-3xl px-6 py-16 text-center">
          <h2 className="font-heading text-2xl font-semibold tracking-tight">
            Ready to get your link?
          </h2>
          <p className="mt-3 text-muted-foreground">
            Start referring today and build an additional income stream while helping others
            access smarter trading technology.
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <Button render={<Link href="/sign-up">Create an account</Link>} />
            <Button variant="outline" render={<Link href="/sign-in">Sign in</Link>} />
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
