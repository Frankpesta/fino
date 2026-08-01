/**
 * Curated photography for the auth split-layout. Placeholder-but-real
 * licensed Unsplash images (photographer credited per Unsplash's terms even
 * though attribution isn't required) -- swap for licensed brand photography
 * before launch, see docs note on real-venture placeholders.
 */
export interface AuthImage {
  src: string;
  alt: string;
  quote: string;
  attribution: string;
}

function unsplash(id: string, params = "w=1800&q=80&auto=format&fit=crop") {
  return `https://images.unsplash.com/photo-${id}?${params}`;
}

export const AUTH_IMAGES: Record<"signIn" | "signUp" | "verifyEmail", AuthImage> = {
  signIn: {
    src: unsplash("1611974789855-9c2a0a7236a3"),
    alt: "Candlestick chart tracking live market price action",
    quote: "Every trade begins with the same discipline: analyze, verify, execute.",
    attribution: "Fino",
  },
  signUp: {
    src: unsplash("1642104704074-907c0698cbd9"),
    alt: "Multiple monitors displaying live crypto market charts",
    quote: "Your account, backed by data-driven strategy from day one.",
    attribution: "Fino",
  },
  verifyEmail: {
    src: unsplash("1611974714022-21c9ca0ea8f0"),
    alt: "Trader reviewing forex charts across dual monitors",
    quote: "One more step before the algorithms get to work.",
    attribution: "Fino",
  },
};

export const MARKETING_IMAGES = {
  home: unsplash("1526374965328-7f61d4dc18c5", "w=2200&q=85&auto=format&fit=crop"),
  about: unsplash("1611974789855-9c2a0a7236a3", "w=1800&q=80&auto=format&fit=crop"),
  affiliate: unsplash("1559526324-4b87b5e36e44", "w=1800&q=80&auto=format&fit=crop"),
  contact: unsplash("1554224155-6726b3ff858f", "w=1800&q=80&auto=format&fit=crop"),
  faq: unsplash("1642790106117-e829e14a795f", "w=1800&q=80&auto=format&fit=crop"),
  services: {
    crypto: unsplash("1642104704074-907c0698cbd9", "w=1200&q=80&auto=format&fit=crop"),
    stocks: unsplash("1590283603385-17ffb3a7f29f", "w=1200&q=80&auto=format&fit=crop"),
    hedge: unsplash("1556761175-4b87b5e36e44", "w=1200&q=80&auto=format&fit=crop"),
    portfolio: unsplash("1554224154-26032ffc0d07", "w=1200&q=80&auto=format&fit=crop"),
    forex: unsplash("1611974714022-21c9ca0ea8f0", "w=1200&q=80&auto=format&fit=crop"),
  },
} as const;
