import type { Access, CollectionConfig, FieldAccess, Where } from "payload";

/**
 * Auth collection powering the Payload admin panel (/admin), the Payload REST
 * API auth AND — since Phase 4 — the client dashboard sign-in (Auth.js
 * Credentials validates against this collection and carries `role` into the
 * session).
 *
 * Roles:
 * - `admin` — factory operator; full content + user management.
 * - `owner` — the client who received the site; manages content, settings,
 *   orders and their own staff from /dashboard.
 * - `staff` — the client's employees; manage content + orders, not users.
 *
 * Access model (server-side gate; the dashboard UI is convenience only):
 * - admin: everything.
 * - owner: manage NON-admin users only (a Where scope — owners can never
 *   read/update/delete the factory admin, so no demote/password takeover),
 *   and never delete themselves.
 * - staff: self read/update only (profile/password).
 * - nobody may change their OWN role; only an admin may assign `admin`.
 *   Trusted server-side writes (seed / Local API with overrideAccess) bypass
 *   the role validate so bootstrap can create the first admin.
 *
 * TODO (backlog): multi-tenant / white-label — add a `tenant` relationship and
 * per-tenant access rules so admins only see their own store's content.
 */

export type DashboardRole = "admin" | "owner" | "staff";

export const DASHBOARD_ROLES: readonly DashboardRole[] = ["admin", "owner", "staff"];

/** Roles allowed to manage users (create accounts, change roles). */
const USER_MANAGER_ROLES: readonly DashboardRole[] = ["admin", "owner"];

interface UserLike {
  id?: string | number;
  role?: DashboardRole | null;
}

const roleOf = (user: UserLike | null | undefined): DashboardRole | undefined =>
  user?.role ?? undefined;

const NON_ADMIN_TARGETS: Where = { role: { not_equals: "admin" } };

/** admin: all · owner: every non-admin doc (self included) · staff: self only. */
const canReadOrUpdateUsers: Access = ({ req }) => {
  const user = req.user as UserLike | null;
  const role = roleOf(user);
  if (role === "admin") return true;
  if (role === "owner") return NON_ADMIN_TARGETS;
  if (user?.id !== undefined) return { id: { equals: user.id } };
  return false;
};

const canCreateUsers: Access = ({ req }) => {
  const role = roleOf(req.user as UserLike | null);
  return !!role && USER_MANAGER_ROLES.includes(role);
};

/** admin: all · owner: non-admin targets excluding themselves · staff: none. */
const canDeleteUsers: Access = ({ req }) => {
  const user = req.user as UserLike | null;
  const role = roleOf(user);
  if (role === "admin") return true;
  if (role === "owner" && user?.id !== undefined) {
    return { and: [NON_ADMIN_TARGETS, { id: { not_equals: user.id } }] };
  }
  return false;
};

/** Only admins/owners may see or set the role field at all. */
const canTouchRoleField: FieldAccess = ({ req }) => {
  const role = roleOf(req.user as UserLike | null);
  return !!role && USER_MANAGER_ROLES.includes(role);
};

/**
 * Privilege rules for role assignment. Pure and exported for unit tests; the
 * field `validate` wires it to the request:
 * - trusted server-side writes (overrideAccess — seed/Local API) pass;
 * - only an admin may grant the `admin` role;
 * - nobody may change their OWN role (prevents owner self-demotion lockouts).
 */
export function validateRoleValue(
  value: unknown,
  ctx: {
    requesterRole?: DashboardRole;
    requesterId?: string | number;
    targetId?: string | number;
    overrideAccess?: boolean;
  },
): true | string {
  if (ctx.overrideAccess) return true;
  if (value === "admin" && ctx.requesterRole !== "admin") {
    return "Only an admin can assign the admin role.";
  }
  if (
    ctx.requesterId !== undefined &&
    ctx.targetId !== undefined &&
    String(ctx.requesterId) === String(ctx.targetId) &&
    value !== ctx.requesterRole
  ) {
    return "You cannot change your own role.";
  }
  return true;
}

export const Users: CollectionConfig = {
  slug: "users",
  auth: true,
  access: {
    read: canReadOrUpdateUsers,
    create: canCreateUsers,
    update: canReadOrUpdateUsers,
    delete: canDeleteUsers,
  },
  admin: {
    useAsTitle: "email",
    defaultColumns: ["name", "email", "role"],
  },
  fields: [
    {
      name: "name",
      type: "text",
    },
    {
      // saveToJWT so the Payload token (used for dashboard REST calls) carries
      // the role without an extra lookup.
      name: "role",
      type: "select",
      required: true,
      defaultValue: "staff",
      saveToJWT: true,
      options: DASHBOARD_ROLES.map((role) => ({ label: role, value: role })),
      validate: (
        value: unknown,
        {
          req,
          id,
          overrideAccess,
        }: { req: { user?: unknown }; id?: number | string; overrideAccess?: boolean },
      ) =>
        validateRoleValue(value, {
          requesterRole: roleOf(req.user as UserLike | null),
          requesterId: (req.user as UserLike | null)?.id,
          targetId: id,
          overrideAccess,
        }),
      access: {
        create: canTouchRoleField,
        update: canTouchRoleField,
      },
    },
  ],
};
