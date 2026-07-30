"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { toast } from "sonner";
import { api } from "@/convex/_generated/api";
import { Mail, CheckCircle2, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SiteHeader } from "@/components/marketing/site-header";
import { SiteFooter } from "@/components/marketing/site-footer";
import { PageHero } from "@/components/marketing/page-hero";
import { MARKETING_IMAGES } from "@/lib/authImages";

const FALLBACK_SUPPORT_EMAIL = "support@fino.app";

export default function ContactPage() {
  const settings = useQuery(api.platformSettings.get);
  const submit = useMutation(api.contact.submit);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [company, setCompany] = useState(""); // honeypot, left empty by real users
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  const supportEmail = settings?.supportContact || FALLBACK_SUPPORT_EMAIL;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await submit({ name, email, subject, message, company });
      setSent(true);
      toast.success("Message sent", { description: "We'll get back to you by email." });
      setName("");
      setEmail("");
      setSubject("");
      setMessage("");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Something went wrong";
      setError(msg);
      toast.error("Couldn't send message", { description: msg });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <PageHero title="Start with a real conversation." eyebrow="Contact Fino" description="Questions about the platform, plans, or your account? Send us a note and we will respond by email." image={MARKETING_IMAGES.contact} />

      <main className="flex-1">
        <section className="mx-auto max-w-5xl px-6 py-20">
          <div className="grid gap-10 lg:grid-cols-[1.5fr_1fr]">
            <div className="rounded-3xl border bg-card p-6 shadow-sm sm:p-8">
              <div className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary"><MessageCircle className="size-5" /></div><h2 className="mt-5 font-heading text-2xl font-semibold tracking-tight">Tell us what you need.</h2><p className="mt-2 text-muted-foreground">We will route your message to the right person.</p>

              {sent ? (
                <div className="mt-8 flex items-start gap-3 rounded-xl border border-border bg-card p-6">
                  <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-primary" />
                  <div>
                    <p className="font-medium">Message sent</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Thanks for reaching out — we&apos;ll reply to your email as soon as we can.
                    </p>
                    <Button
                      variant="outline"
                      className="mt-4"
                      onClick={() => setSent(false)}
                    >
                      Send another message
                    </Button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="mt-8 space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="contact-name">Name</Label>
                      <Input
                        id="contact-name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="contact-email">Email</Label>
                      <Input
                        id="contact-email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contact-subject">Subject</Label>
                    <Input
                      id="contact-subject"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contact-message">Message</Label>
                    <Textarea
                      id="contact-message"
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      rows={6}
                      required
                    />
                  </div>

                  {/* Honeypot -- hidden from real users via CSS, not display:none
                      (some bots skip fields hidden that way), left off the tab
                      order and unlabeled for assistive tech. */}
                  <div className="absolute left-[-9999px]" aria-hidden="true">
                    <label htmlFor="contact-company">Company</label>
                    <input
                      id="contact-company"
                      name="company"
                      type="text"
                      tabIndex={-1}
                      autoComplete="off"
                      value={company}
                      onChange={(e) => setCompany(e.target.value)}
                    />
                  </div>

                  {error && <p className="text-sm text-destructive">{error}</p>}

                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? "Sending..." : "Send"}
                  </Button>
                </form>
              )}
            </div>

            <div className="h-fit rounded-3xl border border-primary/15 bg-ink p-7 text-ink-foreground shadow-xl">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">Direct line</p><h3 className="mt-3 font-heading text-xl font-semibold">Talk to us</h3>
              <div className="mt-4 flex items-start gap-3">
                <Mail className="mt-0.5 size-4 shrink-0 text-primary" />
                <div>
                  <p className="text-xs text-white/50">Email</p>
                  <a
                    href={`mailto:${supportEmail}`}
                    className="text-sm font-medium text-white hover:underline"
                  >
                    {supportEmail}
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
