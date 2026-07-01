import NextAuth, { type NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { z } from "zod";
import { apiClient } from "@/lib/api/client";

/**
 * Auth.js (NextAuth v5), self-hosted, Credentials provider, JWT sessions.
 * AUTH_SECRET + AUTH_TRUST_HOST come from env (see .env.example).
 *
 * The Credentials provider validates against the backend. The backend endpoint
 * is not part of Phase 1's documented REST contract yet, so this is a STUB that
 * posts to `/auth/login` and expects `{ id, email, name, token }`.
 * TODO (backlog): finalize the backend auth endpoint + real JWT validation, and
 * add optional OAuth providers.
 */

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

interface BackendAuthResponse {
  id: string;
  email: string;
  name?: string;
  token: string;
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

        try {
          const res = await apiClient.post<BackendAuthResponse>(
            "/auth/login",
            parsed.data,
            { cache: "no-store" },
          );
          if (!res?.id) return null;
          return {
            id: res.id,
            email: res.email,
            name: res.name ?? res.email,
            // Carry backend JWT so authed API calls can forward it.
            accessToken: res.token,
          };
        } catch {
          return null;
        }
      },
    }),
  ],
  callbacks: {
    jwt: ({ token, user }) => {
      if (user) {
        token.accessToken = (user as { accessToken?: string }).accessToken;
        token.sub = user.id ?? token.sub;
      }
      return token;
    },
    session: ({ session, token }) => {
      if (session.user) {
        session.user.id = token.sub ?? "";
      }
      (session as { accessToken?: string }).accessToken =
        token.accessToken as string | undefined;
      return session;
    },
  },
} satisfies NextAuthConfig;

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);
