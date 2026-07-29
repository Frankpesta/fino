"use client";

import { useRef, type ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import type { AuthImage } from "@/lib/authImages";

gsap.registerPlugin(useGSAP);

/**
 * Two-column auth shell: full-bleed photography + slow Ken Burns drift on
 * the left, form content on the right with a staggered entrance. Children
 * elements tagged `data-animate` are what stagger in -- see sign-in/sign-up/
 * verify-email pages for usage.
 */
export function AuthSplitLayout({
  image,
  eyebrow,
  children,
}: {
  image: AuthImage;
  eyebrow?: string;
  children: ReactNode;
}) {
  const imageRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

    tl.fromTo(imageRef.current, { scale: 1.15 }, { scale: 1.02, duration: 2.4 }, 0);
    tl.to(imageRef.current, { scale: 1.09, duration: 22, ease: "none" }, 2.4);

    tl.fromTo(
      panelRef.current?.querySelectorAll("[data-animate-panel]") ?? [],
      { opacity: 0, y: 12 },
      { opacity: 1, y: 0, duration: 0.9, stagger: 0.15 },
      0.2,
    );

    const items = contentRef.current?.querySelectorAll("[data-animate]");
    tl.fromTo(
      items ?? [],
      { opacity: 0, y: 18 },
      { opacity: 1, y: 0, duration: 0.55, stagger: 0.07 },
      0.35,
    );
  }, []);

  return (
    <div className="flex min-h-screen bg-background">
      <div className="relative hidden w-1/2 overflow-hidden bg-black lg:block">
        <div ref={imageRef} className="absolute inset-0 will-change-transform">
          <Image
            src={image.src}
            alt={image.alt}
            fill
            priority
            sizes="50vw"
            className="object-cover"
          />
        </div>
        {/* Fixed dark scrim regardless of site theme -- the photo needs
            consistent contrast for white text either way. */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/92 via-black/35 to-primary/25" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/45 via-transparent to-transparent" />

        <div ref={panelRef} className="relative flex h-full flex-col justify-between p-10 xl:p-14">
          <Link
            data-animate-panel
            href="/"
            className="font-heading text-xl font-semibold tracking-tight text-white"
          >
            Fino
          </Link>

          <div data-animate-panel className="max-w-md">
            {eyebrow && (
              <p className="mb-4 text-xs font-medium uppercase tracking-[0.25em] text-primary">
                {eyebrow}
              </p>
            )}
            <p className="font-heading text-2xl leading-snug font-medium tracking-tight text-white xl:text-3xl">
              {image.quote}
            </p>
            <div className="mt-6 flex items-center justify-between text-xs text-white/45">
              <span className="uppercase tracking-[0.2em]">{image.attribution}</span>
              <span>Photo: {image.credit}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex w-full flex-col justify-center px-6 py-16 sm:px-12 lg:w-1/2 lg:px-20">
        <Link href="/" className="mb-12 font-heading text-xl font-semibold lg:hidden">
          Fino
        </Link>
        <div ref={contentRef} className="mx-auto w-full max-w-sm">
          {children}
        </div>
      </div>
    </div>
  );
}
