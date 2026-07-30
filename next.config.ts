import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // The photography is served directly by Unsplash. Avoid routing every
    // signed, parameterized source URL through the Next image proxy, which is
    // fragile in restricted/self-hosted deployments and was leaving visual
    // panels blank for users.
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
};

export default nextConfig;
