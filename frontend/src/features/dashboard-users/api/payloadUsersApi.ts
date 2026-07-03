import type { AssignableRole, DashboardUser, UsersListResponse } from "../types";

/**
 * Payload REST access for user management — browser-side like the catalog
 * module, authenticated with the session's Payload JWT. Server-side access
 * rules on the users collection are the real gate; this client is UX.
 */

function headers(token: string): HeadersInit {
  return {
    Accept: "application/json",
    "Content-Type": "application/json",
    Authorization: `JWT ${token}`,
  };
}

async function parseOrThrow<T>(res: Response, context: string): Promise<T> {
  if (!res.ok) {
    throw new Error(`${context} failed with ${res.status}`);
  }
  return (await res.json()) as T;
}

export const payloadUsersApi = {
  list: async (token: string, page = 1, limit = 50): Promise<UsersListResponse> => {
    const res = await fetch(`/api/users?depth=0&limit=${limit}&page=${page}&sort=email`, {
      headers: headers(token),
      cache: "no-store",
    });
    return parseOrThrow<UsersListResponse>(res, "List users");
  },

  create: async (
    token: string,
    data: { email: string; password: string; name?: string; role: AssignableRole },
  ): Promise<DashboardUser> => {
    const res = await fetch("/api/users?depth=0", {
      method: "POST",
      headers: headers(token),
      body: JSON.stringify(data),
    });
    const body = await parseOrThrow<{ doc?: DashboardUser } | DashboardUser>(res, "Create user");
    return (body as { doc?: DashboardUser }).doc ?? (body as DashboardUser);
  },

  updateRole: async (
    token: string,
    id: string | number,
    role: AssignableRole,
  ): Promise<DashboardUser> => {
    const res = await fetch(`/api/users/${id}?depth=0`, {
      method: "PATCH",
      headers: headers(token),
      body: JSON.stringify({ role }),
    });
    const body = await parseOrThrow<{ doc?: DashboardUser } | DashboardUser>(res, "Update role");
    return (body as { doc?: DashboardUser }).doc ?? (body as DashboardUser);
  },

  remove: async (token: string, id: string | number): Promise<void> => {
    const res = await fetch(`/api/users/${id}`, {
      method: "DELETE",
      headers: headers(token),
    });
    await parseOrThrow(res, "Delete user");
  },
};
