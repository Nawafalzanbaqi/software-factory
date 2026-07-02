import NextAuth, { type NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { z } from "zod";

/**
 * Auth.js (NextAuth v5) — ADMIN-ONLY.
 *
 * There is exactly one operator: the credentials are the ADMIN_EMAIL /
 * ADMIN_PASSWORD env vars, checked directly (no user store — this is internal
 * tooling). JWT session strategy. Every page is protected by the `authorized`
 * callback via middleware; unauthenticated requests are redirected to /sign-in.
 *
 * // TODO(phase-4): multi-tenant / real admin authn+authz.
 */

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

/** Constant-time-ish string compare to avoid trivial timing leaks. */
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return mismatch === 0;
}

export const authConfig = {
  trustHost: true,
  session: { strategy: "jwt" },
  pages: {
    signIn: "/sign-in",
  },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (raw) => {
        const parsed = credentialsSchema.safeParse(raw);
        if (!parsed.success) return null;

        const adminEmail = process.env.ADMIN_EMAIL;
        const adminPassword = process.env.ADMIN_PASSWORD;
        if (!adminEmail || !adminPassword) return null;

        const emailOk = safeEqual(
          parsed.data.email.trim().toLowerCase(),
          adminEmail.trim().toLowerCase(),
        );
        const passwordOk = safeEqual(parsed.data.password, adminPassword);
        if (!emailOk || !passwordOk) return null;

        return {
          id: "admin",
          email: adminEmail,
          name: "Factory Admin",
          role: "admin",
        };
      },
    }),
  ],
  callbacks: {
    /**
     * Route protection: all pages require a session. Unauthenticated users are
     * redirected to /sign-in (except the sign-in page itself). Runs in the
     * middleware exported from src/middleware.ts.
     */
    authorized: ({ auth, request }) => {
      const isLoggedIn = !!auth?.user;
      const { pathname } = request.nextUrl;
      const isSignIn = pathname === "/sign-in";
      if (isSignIn) return true;
      return isLoggedIn;
    },
    jwt: ({ token, user }) => {
      if (user) {
        token.sub = user.id ?? token.sub;
        token.role = (user as { role?: string }).role ?? "admin";
      }
      return token;
    },
    session: ({ session, token }) => {
      if (session.user) {
        session.user.id = token.sub ?? "admin";
        session.user.role = (token.role as string) ?? "admin";
      }
      return session;
    },
  },
} satisfies NextAuthConfig;

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);
