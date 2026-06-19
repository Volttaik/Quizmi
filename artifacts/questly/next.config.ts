import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY:
      process.env.CLERK_PUBLISHABLE_KEY ?? "",
  },
  images: {
    remotePatterns: [
      { hostname: "images.fillout.com" },
      { hostname: "img.clerk.com" },
    ],
  },
};

export default nextConfig;
