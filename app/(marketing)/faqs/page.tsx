import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { SiteHeader } from "@/components/marketing/site-header";
import { SiteFooter } from "@/components/marketing/site-footer";
import { PageHero } from "@/components/marketing/page-hero";
import { MARKETING_IMAGES } from "@/lib/authImages";

const FAQ_CATEGORIES: { category: string; items: { question: string; answer: string }[] }[] = [
  {
    category: "General questions",
    items: [
      {
        question: "What is AI-managed trading?",
        answer:
          "AI-managed trading uses artificial intelligence to analyze financial markets, identify trading opportunities, and automate parts of the trading process according to predefined strategies.",
      },
      {
        question: "Is trading fully automated?",
        answer:
          "Depending on your chosen strategy and account settings, trading can be fully automated or include user-defined controls and approvals.",
      },
      {
        question: "Which markets are supported?",
        answer:
          "Zypherex currently supports investing in leading digital assets — BTC, ETH, USDT, USDC, and BNB — through our curated investment plans. We don't offer forex, commodities, or equities at this time.",
      },
      {
        question: "Can beginners use the platform?",
        answer:
          "Yes. The platform is designed to be accessible to users with varying levels of trading experience, with an intuitive dashboard and clear terms shown before you commit.",
      },
      {
        question: "Is there a minimum investment?",
        answer:
          "Yes, and it varies by plan. Our entry-level plan starts at $200, with higher-tier plans requiring larger minimums — always shown up front before you invest.",
      },
    ],
  },
  {
    category: "Security",
    items: [
      {
        question: "Is my data secure?",
        answer:
          "We implement industry-standard security measures designed to protect your information and account access.",
      },
      {
        question: "How do you protect accounts?",
        answer:
          "Security measures include encrypted communications, secure authentication, optional two-factor authentication, and admin review of every deposit and withdrawal before it affects your account.",
      },
    ],
  },
  {
    category: "Accounts",
    items: [
      {
        question: "Can I monitor my trading activity?",
        answer:
          "Yes. Your dashboard shows your balance per currency, active investments, and a full history of deposits, withdrawals, and payouts.",
      },
      {
        question: "Can I withdraw my funds?",
        answer:
          "Yes. Withdrawal requests are reviewed by an admin before funds are released, the same as deposits — you'll get an email as soon as a decision is made.",
      },
      {
        question: "How does my plan's rate work?",
        answer:
          "The rate and payout style shown when you invest are locked in at that moment and won't change even if the plan's terms are updated later.",
      },
    ],
  },
  {
    category: "Risk",
    items: [
      {
        question: "Does AI guarantee profits?",
        answer:
          "No. Trading involves risk, and no technology or strategy — AI-based or otherwise — can guarantee profits or prevent losses.",
      },
      {
        question: "What makes AI different from manual trading?",
        answer:
          "AI processes large volumes of market data rapidly and follows predefined rules consistently, reducing the impact of emotional decision-making.",
      },
    ],
  },
];

export default function FaqsPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <PageHero title="The details, without the runaround." eyebrow="Help center" description="Straight answers to the questions investors ask before they decide." image={MARKETING_IMAGES.faq} />

      <main className="flex-1">
        <section className="mx-auto max-w-3xl px-6 py-20">
          <p className="text-center text-xs font-semibold uppercase tracking-[0.22em] text-primary">Common questions</p>
          <h2 className="mt-3 text-center font-heading text-3xl font-semibold tracking-tight">Everything worth knowing before you begin.</h2>

          <div className="mt-10 space-y-10">
            {FAQ_CATEGORIES.map((group) => (
              <div key={group.category}>
                <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  {group.category}
                </h3>
                <Accordion className="mt-4 rounded-2xl border bg-card px-6 shadow-sm" multiple={false}>
                  {group.items.map((faq) => (
                    <AccordionItem key={faq.question} value={faq.question}>
                      <AccordionTrigger className="text-base">{faq.question}</AccordionTrigger>
                      <AccordionContent className="text-muted-foreground">
                        {faq.answer}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </div>
            ))}
          </div>

          <div className="mt-12 text-center">
            <p className="text-muted-foreground">Still have a question?</p>
            <Button className="mt-4" render={<Link href="/contact">Contact us</Link>} />
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
