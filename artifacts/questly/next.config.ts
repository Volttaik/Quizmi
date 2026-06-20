import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: [
    "@libsql/client",
    "@libsql/hrana-client",
    "@libsql/isomorphic-fetch",
    "@libsql/isomorphic-ws",
    "@libsql/linux-x64-gnu",
    "@libsql/linux-x64-musl",
    "@libsql/darwin-x64",
    "@libsql/darwin-arm64",
    "libsql",
  ],
  transpilePackages: ["pdfjs-dist"],
  eslint: { ignoreDuringBuilds: true },
  webpack: (config, { isServer }) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      canvas: false,
    };

    config.module.rules.push(
      { test: /\.md$/, type: "asset/resource" },
      { test: /LICENSE$/, type: "asset/resource" },
    );

    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
        path: false,
        os: false,
      };
    }

    return config;
  },
};

export default nextConfig;
