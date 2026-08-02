import Link from "next/link";
import Image from "next/image";
import { ChevronRight } from "lucide-react";
import { AUTH_IMAGES } from "@/lib/authImages";

export function PageHero({
  title,
  eyebrow = "Zypherex / Private markets",
  description,
  image,
}: {
  title: string;
  eyebrow?: string;
  description?: string;
  image?: string;
}) {
  return (
    <div className="relative isolate overflow-hidden bg-[#173824] px-5 py-24 text-left text-white sm:px-8 sm:py-32">
      <Image
        src={image ?? AUTH_IMAGES.verifyEmail.src}
        alt=""
        fill
        sizes="100vw"
        className="-z-20 object-cover opacity-20 saturate-50"
      />
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_82%_20%,rgba(188,230,178,.22),transparent_22rem),radial-gradient(circle_at_65%_80%,rgba(214,160,87,.18),transparent_28rem),linear-gradient(120deg,rgba(16,42,28,.92),rgba(23,56,36,.72))]" />
      <div className="relative mx-auto max-w-7xl">
        <div className="max-w-3xl">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#bce6b2]">{eyebrow}</p>
        <h1 className="mt-5 font-heading text-4xl font-semibold leading-[1.08] tracking-[-.045em] text-white sm:text-6xl">
          {title}
        </h1>
        {description && <p className="mt-6 max-w-xl text-balance text-base leading-7 text-white/65 sm:text-lg">{description}</p>}
        <div className="mt-8 flex items-center gap-1.5 text-sm text-white/60">
          <Link href="/" className="text-white/90 hover:text-white hover:underline">
            Home
          </Link>
          <ChevronRight className="size-3.5" />
          <span className="text-white/80">{title}</span>
        </div>
        </div>
      </div>
    </div>
  );
}
