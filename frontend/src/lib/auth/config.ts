import NextAuth, { type NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { z } from "zod";
import { isDashboardRole, type DashboardRole } from "./roles";

/**
 * Auth.js (NextAuth v5), self-hosted, Credentials provider, JWT sessions.
 * AUTH_SECRET + AUTH_TRUST_HOST come from env (see .env.example).
 *
 * Phase 4: the Credentials provider validates against the embedded Payload CMS
 * `users` collection (the site's user store — admin/owner/staff roles), which
 * replaces the Phase 1 stub that posted to a not-yet-built backend /auth/login.
 * The session carries `role` (dashboard authorization) and `payloadToken`
 * (authed Payload REST calls from the dashboard). Backend API bearers are
 * minted on demand server-side — see backend-token.ts.
 * TODO (backlog): optional OAuth providers + password reset.
 */

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

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

        try {
          // Payload Local API login. Imported lazily so importing authConfig
          // (unit tests, edge-adjacent modules) never evaluates the Payload
          // config — only an actual sign-in attempt does.
          const [{ getPayload }, { default: payloadConfig }] = await Promise.all([
            import("payload"),
            import("@payload-config"),
          ]);
          const payload = await getPayload({ config: payloadConfig });
          const result = await payload.login({
            collection: "users",
            data: parsed.data,
          });

          const user = result.user as {
            id: string | number;
            email: string;
            name?: string | null;
            role?: string | null;
          };
          if (!user?.id) return null;

          return {
            id: String(user.id),
            email: user.email,
            name: user.name ?? user.email,
            role: isDashboardRole(user.role) ? user.role : undefined,
            // Payload JWT so dashboard modules can call Payload REST as this user.
            payloadToken: result.token,
          };
        } catch {
          // Bad credentials, locked account, or no DB — all surface as a
          // failed sign-in; never leak the reason to the client.
          return null;
        }
      },
    }),
  ],
  callbacks: {
    jwt: ({ token, user }) => {
      if (user) {
        token.sub = user.id ?? token.sub;
        token.role = (user as { role?: DashboardRole }).role;
        token.payloadToken = (user as { payloadToken?: string }).payloadToken;
      }
      return token;
    },
    session: ({ session, token }) => {
      if (session.user) {
        session.user.id = token.sub ?? "";
        // Casts: the JWT interface keeps an unknown index signature in
        // next-auth beta.31, so augmented custom claims read as unknown.
        session.user.role = token.role as DashboardRole | undefined;
      }
      session.payloadToken = token.payloadToken as string | undefined;
      return session;
    },
  },
} satisfies NextAuthConfig;

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);
