import type { CollectionConfig } from "payload";

/**
 * Promotional banners for the homepage carousel. `headline`/`subcopy`/`ctaLabel`
 * are localized. The lib/cms fetcher maps headline -> title and ctaHref -> href to
 * satisfy the PromoBanner content type. Only `enabled` banners are served, ordered
 * by `order`.
 */
export const PromoBanners: CollectionConfig = {
  slug: "promoBanners",
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
