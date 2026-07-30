"use client";

import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Link2, UserPlus, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { SiteHeader } from "@/components/marketing/site-header";
import { SiteFooter } from "@/components/marketing/site-footer";
import { PageHero } from "@/components/marketing/page-hero";
import { MARKETING_IMAGES } from "@/lib/authImages";

const STEPS = [
  {
    icon: Link2,
    title: "Get your link",
    description:
      "Every account has a unique referral link and code, available on your Referrals page after you sign up.",
  },
  {
    icon: UserPlus,
    title: "Share it",
    description: "Send it to anyone you think would want an account. They sign up through it.",
  },
  {
    icon: Wallet,
    title: "Earn on their deposits",
    description:
      "Once one of their deposits is approved, a commission is credited to your balance automatically.",
  },
];

export default function AffiliatePage() {
  const settings = useQuery(api.platformSettings.get);

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <PageHero title="Share the platform you trust." eyebrow="Partner program" description="Invite investors who value clear terms and earn when their approved deposits are credited." image={MARKETING_IMAGES.affiliate} />

      <main className="flex-1">
        <section className="mx-auto max-w-4xl px-6 py-20">
          <h2 className="font-heading text-2xl font-semibold tracking-tight">
            A reward for thoughtful introductions.
          </h2>
          <p className="mt-4 text-muted-foreground">
            Fino&apos;s growth is difficult to imagine without the help of the investors who use
            it. Today, any of our clients can become a partner and earn through their affiliate
            link. After registration, every account receives a unique referral link containing
            its referral code. Send that link to a friend by email or message — once they sign up
            through it, they become your referral.
          </p>
          <p className="mt-4 text-muted-foreground">
            Commission is accrued automatically the moment one of your referrals&apos; deposits is
            approved — not just for signing up. It&apos;s credited directly to your account
            balance, where you can withdraw it or use it toward your own investment. To become an
            affiliate and start earning, you don&apos;t even need an active investment of your
            own.
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
            <div className="mt-10 grid gap-6 lg:grid-cols-3">
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

        <section className="mx-auto max-w-3xl px-6 py-16 text-center">
          <h2 className="font-heading text-2xl font-semibold tracking-tight">
            Ready to get your link?
          </h2>
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
