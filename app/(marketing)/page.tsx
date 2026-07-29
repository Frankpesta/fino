"use client";

import { useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { AUTH_IMAGES } from "@/lib/authImages";

gsap.registerPlugin(useGSAP);

export default function MarketingHomePage() {
  const heroRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    gsap.fromTo(
      heroRef.current?.querySelectorAll("[data-animate]") ?? [],
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 0.8, stagger: 0.12, ease: "power3.out", delay: 0.1 },
    );
  }, []);

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-black">
      <div className="absolute inset-0">
        <Image
          src={AUTH_IMAGES.signIn.src}
          alt=""
          fill
          priority
          className="object-cover opacity-40"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/60 to-black" />
      </div>

      <header className="relative z-10 flex items-center justify-between p-6 sm:p-8">
        <span className="font-heading text-lg font-semibold text-white">Fino</span>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Button
            variant="ghost"
            className="text-white hover:bg-white/10 hover:text-white"
            render={<Link href="/sign-in">Sign in</Link>}
          />
          <Button render={<Link href="/sign-up">Sign up</Link>} />
        </div>
      </header>

      <main
        ref={heroRef}
        className="relative z-10 flex flex-1 flex-col items-center justify-center gap-7 p-6 text-center"
      >
        <p
          data-animate
          className="text-xs font-medium uppercase tracking-[0.3em] text-primary"
        >
          A private trading desk for digital assets
        </p>
        <h1
          data-animate
          className="max-w-3xl font-heading text-5xl leading-tight font-semibold tracking-tight text-white sm:text-6xl"
        >
          Capital deserves the same discipline as the trades it funds.
        </h1>
        <p data-animate className="max-w-xl text-balance text-white/70">
          Deposit, invest in a plan, and track accrual in real time. Every plan shows a target
          rate, not a guarantee — returns depend on trading performance.
        </p>
        <div data-animate className="flex gap-3 pt-2">
          <Button size="lg" render={<Link href="/sign-up">Open an account</Link>} />
          <Button
            size="lg"
            variant="outline"
            className="border-white/25 bg-transparent text-white hover:bg-white/10 hover:text-white"
            render={<Link href="/sign-in">Sign in</Link>}
          />
        </div>
      </main>
    </div>
  );
}
