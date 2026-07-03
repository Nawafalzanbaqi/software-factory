import { isDashboardRole, isOwnerRole, type DashboardRole } from "@/lib/auth/roles";

/**
 * Pure dashboard access decision — no Next.js control flow, so it is unit
 * testable. The server guard (guards.ts) maps each decision onto
 * notFound()/redirect()/forbidden().
 *
 * Check order is part of the contract (§6 gating rule):
 * 1. flag off => "not-found" — a disabled area is ABSENT (404), even for
 *    signed-in users; it must not leak that the route exists.
 * 2. no session => "sign-in".
 * 3. session without a dashboard role (or staff on an owner-only surface)
 *    => "forbidden" (403).
 */
export type DashboardAccessDecision =
  | { kind: "not-found" }
  | { kind: "sign-in" }
  | { kind: "forbidden" }
  | { kind: "ok"; role: DashboardRole };

export interface DashboardAccessInput {
  /** features.clientDashboard — the master switch. */
  dashboardEnabled: boolean;
  /** The page's module flag (features.dashboard*); defaults to enabled. */
  moduleEnabled?: boolean;
  /** session.user (null/undefined when unauthenticated). */
  user?: { role?: unknown } | null;
  /** Owner-only surface (users & roles). */
  ownerOnly?: boolean;
}

export function decideDashboardAccess({
  dashboardEnabled,
  moduleEnabled = true,
  user,
  ownerOnly = false,
}: DashboardAccessInput): DashboardAccessDecision {
  if (!dashboardEnabled || !moduleEnabled) return { kind: "not-found" };
  if (!user) return { kind: "sign-in" };
  if (!isDashboardRole(user.role)) return { kind: "forbidden" };
  if (ownerOnly && !isOwnerRole(user.role)) return { kind: "forbidden" };
  return { kind: "ok", role: user.role };
}
