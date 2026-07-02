import type { CollectionConfig } from "payload";

/**
 * Gallery (restaurant vertical). CMS-driven image gallery for the homepage gallery
 * section (PHASE2 §4). `title` is localized (en/ar); `images` is an ordered list of
 * Media uploads. Only `enabled` entries are served, ordered by `order`.
 *
 * TODO(phase-3): multi-tenant — scope galleries per tenant/brand.
 */
export const Gallery: CollectionConfig = {
  slug: "gallery",
  access: {
    read: () => true,
  },
  admin: {
    useAsTitle: "title",
    defaultColumns: ["title", "order", "enabled"],
  },
  fields: [
    {
      name: "title",
      type: "text",
      required: true,
      localized: true,
    },
    {
      name: "images",
      type: "upload",
      relationTo: "media",
      hasMany: true,
    },
    {
      name: "order",
      type: "number",
      defaultValue: 0,
      index: true,
    },
    {
      name: "enabled",
      type: "checkbox",
      defaultValue: true,
    },
  ],
};
