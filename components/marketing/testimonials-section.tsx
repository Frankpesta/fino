"use client";

import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Star } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Testimonial { name: string; role: string; quote: string; }

const TESTIMONIALS: Testimonial[] = [
  { name: "Adaeze N.", role: "Investor since 2023", quote: "The terms are visible before I commit to anything, and the ledger updates the moment a review clears. That alone changed how I think about digital-asset investing." },
  { name: "Marcus T.", role: "Investor since 2024", quote: "Every deposit and withdrawal goes through a manual check. It slows things down by a day, but I've never once wondered where my funds stood." },
  { name: "Priya S.", role: "Investor since 2022", quote: "Fino was the only platform I compared that showed target rates and durations without burying the risk language." },
  { name: "Daniel O.", role: "Investor since 2024", quote: "The dashboard reads like a proper statement, not a trading screen. I can tell my partner exactly where our money sits in under a minute." },
  { name: "Helena W.", role: "Investor since 2023", quote: "Referral payouts land in the same ledger as everything else, clearly labeled. No separate portal, no guesswork." },
];

function initialsFor(name: string) { return name.split(" ").map((part) => part[0]).join("").slice(0, 2); }

export function TestimonialsSection() {
  const [active, setActive] = useState(0);
  useEffect(() => { const timer = window.setInterval(() => setActive((current) => (current + 1) % TESTIMONIALS.length), 6500); return () => window.clearInterval(timer); }, []);
  const testimonial = TESTIMONIALS[active];
  return <section className="overflow-hidden bg-[#173824] px-5 py-20 text-[#fbf7ed] sm:px-8 sm:py-24"><div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[.7fr_1.3fr] lg:items-end"><div><p className="text-xs font-semibold uppercase tracking-[.22em] text-[#bce6b2]">Client perspectives</p><h2 className="mt-4 font-heading text-4xl font-semibold leading-[1.08] tracking-[-.045em] sm:text-5xl">A calmer way to stay close to your capital.</h2><p className="mt-5 max-w-sm text-sm leading-6 text-white/60">The people who use Fino value the same things: clear terms, visible records, and less noise around important decisions.</p><div className="mt-8 flex items-center gap-2"><Button variant="outline" size="icon" className="border-white/15 bg-white/5 text-white hover:bg-white/10 hover:text-white" onClick={() => setActive((active - 1 + TESTIMONIALS.length) % TESTIMONIALS.length)} aria-label="Previous perspective"><ChevronLeft /></Button><Button variant="outline" size="icon" className="border-white/15 bg-white/5 text-white hover:bg-white/10 hover:text-white" onClick={() => setActive((active + 1) % TESTIMONIALS.length)} aria-label="Next perspective"><ChevronRight /></Button></div></div><figure className="relative min-h-80 rounded-[2rem] border border-white/12 bg-white/[.07] p-7 backdrop-blur-sm sm:p-10"><div className="flex text-[#d6a057]">{Array.from({ length: 5 }).map((_, index) => <Star key={index} className="size-4 fill-current" />)}</div><blockquote className="mt-8 font-heading text-2xl font-medium leading-[1.35] tracking-[-.025em] sm:text-3xl">“{testimonial.quote}”</blockquote><figcaption className="mt-9 flex items-center gap-3"><span className="flex size-11 items-center justify-center rounded-full bg-[#bce6b2] text-sm font-bold text-[#173824]">{initialsFor(testimonial.name)}</span><div><p className="font-semibold">{testimonial.name}</p><p className="mt-0.5 text-sm text-white/55">{testimonial.role}</p></div></figcaption><div className="absolute bottom-8 right-8 flex gap-1.5">{TESTIMONIALS.map((item, index) => <button key={item.name} aria-label={`Show testimonial ${index + 1}`} onClick={() => setActive(index)} className={`h-1.5 rounded-full transition-all ${index === active ? "w-7 bg-[#bce6b2]" : "w-1.5 bg-white/25"}`} />)}</div></figure></div></section>;
}
