import { Star } from "lucide-react";

interface Testimonial {
  name: string;
  role: string;
  quote: string;
}

const TESTIMONIALS: Testimonial[] = [
  {
    name: "Adaeze N.",
    role: "Investor since 2023",
    quote:
      "The terms are visible before I commit to anything, and the ledger updates the moment a review clears. That alone changed how I think about digital-asset investing.",
  },
  {
    name: "Marcus T.",
    role: "Investor since 2024",
    quote:
      "Every deposit and withdrawal goes through a manual check. It slows things down by a day, but I've never once wondered where my funds stood.",
  },
  {
    name: "Priya S.",
    role: "Investor since 2022",
    quote:
      "I compared a handful of platforms before settling here. Fino was the only one that showed target rates and durations without burying the risk language.",
  },
  {
    name: "Daniel O.",
    role: "Investor since 2024",
    quote:
      "The dashboard reads like a proper statement, not a trading screen. I can tell my partner exactly where our money sits in under a minute.",
  },
  {
    name: "Helena W.",
    role: "Investor since 2023",
    quote:
      "Referral payouts land in the same ledger as everything else, clearly labeled. No separate portal, no guesswork.",
  },
];

function initialsFor(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2);
}

export function TestimonialsSection() {
  return (
    <section className="px-6 py-20">
      <div className="mx-auto max-w-6xl">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">Client outcomes</p>
          <h2 className="mt-3 font-heading text-4xl font-semibold tracking-tight">
            Trusted by investors who read the fine print.
          </h2>
        </div>
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {TESTIMONIALS.map((testimonial) => (
            <figure
              key={testimonial.name}
              className="flex flex-col rounded-2xl border bg-card p-7 shadow-sm"
            >
              <div className="flex text-accent-foreground">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="size-3.5 fill-current" />
                ))}
              </div>
              <blockquote className="mt-4 flex-1 font-heading text-lg leading-7 italic text-foreground">
                “{testimonial.quote}”
              </blockquote>
              <figcaption className="mt-6 flex items-center gap-3">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-accent text-sm font-semibold text-accent-foreground">
                  {initialsFor(testimonial.name)}
                </span>
                <div>
                  <p className="text-sm font-semibold">{testimonial.name}</p>
                  <p className="text-xs text-muted-foreground">{testimonial.role}</p>
                </div>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
