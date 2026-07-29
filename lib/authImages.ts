/**
 * Curated photography for the auth split-layout. Placeholder-but-real
 * licensed Unsplash images (photographer credited per Unsplash's terms even
 * though attribution isn't required) -- swap for licensed brand photography
 * before launch, see docs note on real-venture placeholders.
 */
export interface AuthImage {
  src: string;
  alt: string;
  credit: string;
  quote: string;
  attribution: string;
}

function unsplash(id: string, params = "w=1800&q=80&auto=format&fit=crop") {
  return `https://images.unsplash.com/photo-${id}?${params}`;
}

export const AUTH_IMAGES: Record<"signIn" | "signUp" | "verifyEmail", AuthImage> = {
  signIn: {
    src: unsplash("1762194859810-003063d4c85d"),
    alt: "Illuminated skyscrapers of a financial district at night",
    credit: "Massimiliano Morosinotto",
    quote: "Capital deserves the same discipline as the trades it funds.",
    attribution: "Fino",
  },
  signUp: {
    src: unsplash("1751200065697-4461cc2b43cb"),
    alt: "A dimly lit desk with a laptop and monitor",
    credit: "Zoshua Colah",
    quote: "Every account starts with the same standard: verified, audited, accountable.",
    attribution: "Fino",
  },
  verifyEmail: {
    src: unsplash("1750800676784-d68e2f2533de"),
    alt: "Abstract blue, teal, and purple gradient",
    credit: "Nat Fleming",
    quote: "One more step. Precision first, always.",
    attribution: "Fino",
  },
};
