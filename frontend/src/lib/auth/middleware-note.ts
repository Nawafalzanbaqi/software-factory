/**
 * PROTECTED ROUTES NOTE
 *
 * The following route groups require an authenticated session (ARCHITECTURE.md §4):
 *   - /[locale]/orders/**
 *   - /[locale]/wishlist
 *   - /[locale]/dashboard/**
 *
 * Phase 1 enforces this at the page/layout level using getSession() and
 * redirect() (keeps the edge middleware focused on i18n + security headers).
 * Example guard for a protected page:
 *
 *   import { getSession } from "@/lib/auth/session";
 *   import { redirect } from "@/lib/i18n/navigation";
 *   const session = await getSession();
 *   if (!session) redirect({ href: "/sign-in", locale });
 *
 * TODO (backlog): move protection to the edge by composing an auth() check into
 * src/middleware.ts once the sign-in flow + backend auth endpoint are finalized.
 */
export const PROTECTED_PREFIXES = ["/orders", "/wishlist", "/dashboard"] as const;
