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

const FAQS: { question: string; answer: string }[] = [
  {
    question: "What is Fino?",
    answer:
      "Fino is a private trading desk for digital assets. You deposit funds, invest in one of our curated plans, and track accrual in real time from your dashboard.",
  },
  {
    question: "How do deposits work?",
    answer:
      "You choose a currency and amount, send funds to the address shown, and optionally attach proof of payment. An admin reviews and approves the deposit before it's credited to your balance — deposits aren't auto-approved.",
  },
  {
    question: "How do I withdraw funds?",
    answer:
      "Sign in, go to Withdrawals, and request a withdrawal to your own address. Like deposits, withdrawals are reviewed by an admin before they're processed; you'll get an email as soon as a decision is made.",
  },
  {
    question: "Can I lose money?",
    answer:
      "Yes. Plan rates shown are targets, not guarantees — returns depend on trading performance, and investing carries risk. Past performance is never a promise of future results.",
  },
  {
    question: "How does an investment plan's rate work?",
    answer:
      "The rate and payout style shown when you invest are locked onto your investment at that moment, and won't change even if the plan's terms are updated later. Interest accrues daily, pro-rated from the plan's stated rate.",
  },
  {
    question: "How do I open an account?",
    answer:
      "Click Sign Up, enter your email and password, and verify your email with the code we send. You can optionally enable two-factor authentication afterward from your profile.",
  },
  {
    question: "I can't sign in — what do I do?",
    answer:
      "Double-check your email and password. If you've forgotten your password, use the \"Forgot password?\" link on the sign-in page to reset it by email.",
  },
  {
    question: "How can I check my account balance?",
    answer:
      "Your dashboard shows your current balance per currency, active investments, and full transaction history, available any time you're signed in.",
  },
  {
    question: "May I open more than one account?",
    answer:
      "No — one account per person. This keeps verification and referral tracking accurate. Contact us if you have a specific situation you'd like to discuss.",
  },
  {
    question: "How can I contact support?",
    answer:
      "Use the Contact page to send us a message, and we'll get back to you by email.",
  },
];

export default function FaqsPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <PageHero title="The details, without the runaround." eyebrow="Help center" description="Straight answers to the questions investors ask before they decide." image={MARKETING_IMAGES.faq} />

      <main className="flex-1">
        <section className="mx-auto max-w-3xl px-6 py-20"><p className="text-center text-xs font-semibold uppercase tracking-[0.22em] text-primary">Common questions</p><h2 className="mt-3 text-center font-heading text-3xl font-semibold tracking-tight">Everything worth knowing before you begin.</h2>

          <Accordion className="mt-10 rounded-2xl border bg-card px-6 shadow-sm" multiple={false}>
            {FAQS.map((faq) => (
              <AccordionItem key={faq.question} value={faq.question}>
                <AccordionTrigger className="text-base">{faq.question}</AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>

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
