import type { NextConfig } from "next";

const libsqlPackages = [
  "@libsql/client",
  "@libsql/hrana-client",
  "@libsql/isomorphic-fetch",
  "@libsql/isomorphic-ws",
  "@libsql/linux-x64-gnu",
  "@libsql/linux-x64-musl",
  "@libsql/darwin-x64",
  "@libsql/darwin-arm64",
  "libsql",
];

const nextConfig: NextConfig = {
  outputFileTracingRoot: require("path").join(__dirname, "../../"),
  outputFileTracingExcludes: {
    "*": [
      "**/@libsql/linux-arm64-gnu/**",
      "**/@libsql/linux-arm64-musl/**",
      "**/@libsql/darwin-x64/**",
      "**/@libsql/darwin-arm64/**",
      "**/@libsql/win32-x64-msvc/**",
      "**/pdfjs-dist/**",
    ],
  },
  serverExternalPackages: libsqlPackages,
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

    if (isServer) {
      const existingExternals = Array.isArray(config.externals)
        ? config.externals
        : config.externals
          ? [config.externals]
          : [];
      config.externals = [
        ...existingExternals,
        ({ request }: { request?: string }, callback: (err?: Error | null, result?: string) => void) => {
          if (request && /^(@libsql\/|libsql\b)/.test(request)) {
            return callback(null, `commonjs ${request}`);
          }
          callback();
        },
      ];
    }

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
