import type { NextConfig } from "next";

/**
 * STATIC_EXPORT=1 builds a static frontend bundle (used for sandbox previews where the API runs as a
 * separate Next server). Vercel deployments leave it unset and get the normal hybrid build with
 * API routes.
 */
const isStaticExport = process.env.STATIC_EXPORT === "1";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  serverExternalPackages: ["sharp"],
  ...(isStaticExport
    ? {
        output: "export" as const,
        distDir: ".next-export",
        assetPrefix: ".",
        images: { unoptimized: true },
      }
    : {}),
};

export default nextConfig;
