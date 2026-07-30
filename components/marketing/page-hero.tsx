import Link from "next/link";
import Image from "next/image";
import { ChevronRight } from "lucide-react";
import { AUTH_IMAGES } from "@/lib/authImages";

export function PageHero({
  title,
  eyebrow = "Fino / Private markets",
  description,
  image,
}: {
  title: string;
  eyebrow?: string;
  description?: string;
  image?: string;
}) {
  return (
    <div className="relative isolate overflow-hidden border-b border-white/10 bg-ink px-6 py-20 text-center sm:py-24">
      <Image
        src={image ?? AUTH_IMAGES.verifyEmail.src}
        alt=""
        fill
        sizes="100vw"
        className="-z-20 object-cover opacity-20 saturate-50"
      />
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_50%_0%,oklch(0.42_0.14_155_/_0.38),transparent_52%),linear-gradient(180deg,oklch(0.13_0.02_155_/_0.3),oklch(0.11_0.018_155_/_0.96))]" />
      <div className="relative mx-auto max-w-3xl">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/55">{eyebrow}</p>
        <h1 className="mt-3 font-heading text-4xl font-semibold tracking-tight text-white sm:text-5xl">
          {title}
        </h1>
        {description && <p className="mx-auto mt-4 max-w-xl text-balance text-sm leading-6 text-white/65 sm:text-base">{description}</p>}
        <div className="mt-5 flex items-center justify-center gap-1.5 text-sm text-white/60">
          <Link href="/" className="text-white/90 hover:text-white hover:underline">
            Home
          </Link>
          <ChevronRight className="size-3.5" />
          <span className="text-white/80">{title}</span>
        </div>
      </div>
    </div>
  );
}
