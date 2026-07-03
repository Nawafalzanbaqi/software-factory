import "server-only";
import { auth } from "./config";
import { mintBackendToken } from "./backend-token";
import { isDashboardRole, type DashboardRole } from "./roles";

/**
 * Server helper to read the current session. Use in Server Components / route
 * handlers to gate protected UI. Returns null when unauthenticated.
 */
export async function getSession() {
  return auth();
}

/**
 * Short-lived backend bearer for the signed-in user, minted on demand
 * (ARCHITECTURE.md §4). Undefined when unauthenticated — callers pass it to
 * lib/api/client which forwards it as `Authorization: Bearer`.
 */
export async function getAccessToken(): Promise<string | undefined> {
  const session = await auth();
  if (!session?.user?.id) return undefined;
  return mintBackendToken({
    id: session.user.id,
    email: session.user.email,
    role: session.user.role,
  });
}

/** The dashboard role of the current session, or null when absent/not a dashboard role. */
export async function getDashboardRole(): Promise<DashboardRole | null> {
  const session = await auth();
  const role = session?.user?.role;
  return isDashboardRole(role) ? role : null;
}
