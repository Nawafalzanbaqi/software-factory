import "server-only";
import { auth } from "./config";

/**
 * Server helper to read the current session. Use in Server Components / route
 * handlers to gate protected UI. Returns null when unauthenticated.
 */
export async function getSession() {
  return auth();
}

/** Convenience: the backend access token for forwarding to authed API calls. */
export async function getAccessToken(): Promise<string | undefined> {
  const session = (await auth()) as { accessToken?: string } | null;
  return session?.accessToken;
}
