import type { NextConfig } from "next";

/**
 * Factory Dashboard — self-contained internal admin tooling (Phase 3).
 * English only, no next-intl, no Payload. Standalone output for the Docker image.
 */
const nextConfig: NextConfig = {
  output: "standalone",
  reactStrictMode: true,
  poweredByHeader: false,
};

export default nextConfig;
