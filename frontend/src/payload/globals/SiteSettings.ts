import type { Access, GlobalConfig } from "payload";

/**
 * Client-managed site settings (Phase 4, features.dashboardSettings). Edited
 * from the client dashboard's Settings module through the Payload REST API —
 * NOT from options.json, which stays a build-time factory manifest. Editorial
 * text is localized like every other global.
 */

const canEditSettings: Access = ({ req }) => {
  const role = (req.user as { role?: string } | null)?.role;
  return role === "admin" || role === "owner" || role === "staff";
};

export const SiteSettings: GlobalConfig = {
  slug: "siteSettings",
  access: {
    // Site chrome data (tagline, support contacts) — publicly readable like
    // the other content globals; writes are dashboard-role gated.
    read: () => true,
    update: canEditSettings,
  },
  fields: [
    {
      name: "tagline",
      type: "text",
      localized: true,
    },
    {
      name: "announcement",
      type: "textarea",
      localized: true,
    },
    {
      name: "supportEmail",
      type: "email",
    },
    {
      name: "supportPhone",
      type: "text",
    },
    {
      name: "social",
      type: "group",
      fields: [
        { name: "twitter", type: "text" },
        { name: "instagram", type: "text" },
        { name: "tiktok", type: "text" },
      ],
    },
  ],
};
