import type { CollectionConfig } from "payload";

/**
 * Auth collection powering the Payload admin panel (/admin) and API auth.
 *
 * TODO (backlog): multi-tenant / white-label — add a `tenant` relationship and
 * per-tenant access rules so admins only see their own store's content.
 */
export const Users: CollectionConfig = {
  slug: "users",
  auth: true,
  admin: {
    useAsTitle: "email",
    defaultColumns: ["name", "email"],
  },
  fields: [
    {
      name: "name",
      type: "text",
    },
  ],
};
