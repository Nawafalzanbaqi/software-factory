import type { CollectionConfig } from "payload";

/**
 * Promotions (restaurant vertical) — mirrors the PromoBanners shape so the homepage
 * promotions section (PHASE2 §4) reuses the same authoring model. `headline`/
 * `subcopy`/`ctaLabel` are localized. The lib/cms fetcher maps headline -> title and
 * ctaHref -> href. Only `enabled` promotions are served, ordered by `order`.
 *
 * TODO(phase-3): multi-tenant — scope promotions per tenant/brand.
 */
export const Promotions: CollectionConfig = {
  slug: "promotions",
  access: {
    read: () => true,
  },
  admin: {
    useAsTitle: "headline",
    defaultColumns: ["headline", "order", "enabled"],
  },
  fields: [
    {
      name: "image",
      type: "upload",
      relationTo: "media",
    },
    {
      name: "headline",
      type: "text",
      required: true,
      localized: true,
    },
    {
      name: "subcopy",
      type: "textarea",
      localized: true,
    },
    {
      name: "ctaLabel",
      type: "text",
      localized: true,
    },
    {
      name: "ctaHref",
      type: "text",
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
