"use client";

import { SessionProvider } from "next-auth/react";

/**
 * Client boundary for Auth.js session state. Wrapping the app lets interactive
 * nav leaves (AccountMenu, MobileNav) read the session via `useSession` WITHOUT
 * forcing the server layout/pages to read cookies — so static prerendering /
 * SSG of content pages is preserved. The session is hydrated client-side from
 * /api/auth/session (excluded from the next-intl middleware matcher).
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>;
}
