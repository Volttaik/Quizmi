import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: [
    "@libsql/client",
    "libsql",
    "@libsql/linux-x64-gnu",
    "@libsql/linux-x64-musl",
  ],
  transpilePackages: ["pdfjs-dist"],
  eslint: { ignoreDuringBuilds: true },
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      canvas: false,
    };
    return config;
  },
};

export default nextConfig;
