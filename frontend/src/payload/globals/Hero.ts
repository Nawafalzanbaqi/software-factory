import type { GlobalConfig } from "payload";

/**
 * Hero global — homepage hero copy. Fields map 1:1 to the HeroContent type in
 * src/lib/cms/types.ts (all text localized en/ar; hrefs are plain strings).
 */
export const Hero: GlobalConfig = {
  slug: "hero",
  access: {
    read: () => true,
  },
  fields: [
    {
      name: "eyebrow",
      type: "text",
      localized: true,
    },
    {
      name: "title",
      type: "text",
      required: true,
      localized: true,
    },
    {
      name: "subtitle",
      type: "textarea",
      required: true,
      localized: true,
    },
    {
      name: "ctaPrimaryLabel",
      type: "text",
      localized: true,
    },
    {
      name: "ctaPrimaryHref",
      type: "text",
    },
    {
      name: "ctaSecondaryLabel",
      type: "text",
      localized: true,
    },
    {
      name: "ctaSecondaryHref",
      type: "text",
    },
    {
      name: "image",
      type: "upload",
      relationTo: "media",
    },
  ],
};
