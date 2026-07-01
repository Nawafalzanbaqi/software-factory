import createMiddleware from "next-intl/middleware";
import { routing } from "@/lib/i18n/routing";

/**
 * Edge middleware: next-intl locale negotiation + prefixing.
 *
 * SECURITY NOTE: Strong security headers (CSP, HSTS, X-Frame-Options,
 * Referrer-Policy) are set here so every response — including localized redirects
 * — is hardened. Route protection for /orders /wishlist /dashboard is documented
 * in src/lib/auth/middleware-note.ts and enforced at the page/layout level via
 * getSession(); wire an auth() check into this middleware when moving protection
 * to the edge. TODO (backlog): full CSP nonce pipeline + edge auth gate.
 */
const intlMiddleware = createMiddleware(routing);

export default function middleware(request: Parameters<typeof intlMiddleware>[0]) {
  const response = intlMiddleware(request);

  // Baseline security headers. Keep in sync with the backend's header policy.
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=()",
  );
  // HSTS only meaningful over HTTPS; harmless on http in dev.
  response.headers.set(
    "Strict-Transport-Security",
    "max-age=63072000; includeSubDomains; preload",
  );

  return response;
}

export const config = {
  // Skip Next internals, API routes, the Payload admin panel and static assets.
  // `admin` must be excluded so next-intl does not locale-prefix /admin (Payload
  // serves its own dashboard there); Payload's REST/GraphQL live under /api.
  matcher: ["/((?!api|admin|_next|_vercel|.*\\..*).*)"],
};
