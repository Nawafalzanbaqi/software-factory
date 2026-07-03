import type { PaginatedDocs } from "payload";
import type { User } from "@/payload-types";

/**
 * Users & roles types — doc shape derives from the generated Payload types.
 * Owners manage owner/staff only; the admin role is assignable exclusively by
 * factory admins (enforced by the Users collection field access + validate).
 */
export type DashboardUser = User;

export type UsersListResponse = PaginatedDocs<DashboardUser>;

/** Roles an owner can assign from the dashboard. */
export const ASSIGNABLE_ROLES = ["owner", "staff"] as const;
export type AssignableRole = (typeof ASSIGNABLE_ROLES)[number];
