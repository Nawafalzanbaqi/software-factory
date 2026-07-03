/**
 * Dashboard role model (Phase 4). Kept dependency-free (no server-only) so both
 * server guards and client leaves (e.g. nav filtering) can import it.
 *
 * - `admin` — factory operator (full Payload admin).
 * - `owner` — the client; everything in /dashboard incl. users & roles.
 * - `staff` — the client's employees; /dashboard minus user management.
 */
export type DashboardRole = "admin" | "owner" | "staff";

/** Roles allowed into /dashboard at all. */
export const DASHBOARD_ROLES: readonly DashboardRole[] = ["admin", "owner", "staff"];

/** Roles allowed into owner-only dashboard surfaces (users & roles). */
export const OWNER_ROLES: readonly DashboardRole[] = ["admin", "owner"];

export function isDashboardRole(role: unknown): role is DashboardRole {
  return typeof role === "string" && (DASHBOARD_ROLES as readonly string[]).includes(role);
}

export function isOwnerRole(role: unknown): role is DashboardRole {
  return typeof role === "string" && (OWNER_ROLES as readonly string[]).includes(role);
}
