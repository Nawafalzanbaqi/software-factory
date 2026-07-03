import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";
import { withPayload } from "@payloadcms/next/withPayload";

// Point next-intl at the request config used by getRequestConfig.
const withNextIntl = createNextIntlPlugin("./src/lib/i18n/request.ts");

const nextConfig: NextConfig = {
  // Produce a standalone server bundle for the multi-stage Docker image.
  output: "standalone",
  reactStrictMode: true,
  poweredByHeader: false,
  images: {
    // Serve modern formats first; Next negotiates per Accept header.
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      // Backend / Payload media host. Tighten to real hosts in prod.
      { protocol: "https", hostname: "**.softwarefactory.local" },
      { protocol: "http", hostname: "localhost" },
      { protocol: "https", hostname: "images.unsplash.com" },
    ],
  },
  experimental: {
    // Keep server actions payloads small; tune as needed.
    optimizePackageImports: ["lucide-react"],
    // Phase 4: forbidden() for the dashboard role gate (wrong role => real 403).
    authInterrupts: true,
  },
};

// withPayload wraps the config so Payload can inject its bundler aliases
// (incl. @payload-config) and server-external packages. Order matters: Payload
// must wrap the already next-intl-wrapped config.
export default withPayload(withNextIntl(nextConfig));
