import type { Access, GlobalConfig } from "payload";
import { isDashboardModuleEnabled } from "../manifest-flags";

/**
 * Client-managed site settings (Phase 4, features.dashboardSettings). Edited
 * from the client dashboard's Settings module through the Payload REST API —
 * NOT from options.json, which stays a build-time factory manifest. Editorial
 * text is localized like every other global.
 *
 * Writes are OWNER-scoped per the documented role model (security audit
 * fix #4: staff manage content + orders, not site settings) and manifest-gated
 * (fix #3): features.clientDashboard + features.dashboardSettings off ⇒ the
 * update surface is absent for owners too. The factory-operator admin path is
 * not gated.
 */

const canEditSettings: Access = ({ req }) => {
  const role = (req.user as { role?: string } | null)?.role;
  if (role === "admin") return true;
  return role === "owner" && isDashboardModuleEnabled("dashboardSettings");
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
