import type { CollectionConfig } from "payload";

/**
 * Upload collection for all CMS imagery (hero, promo banners, products, etc.).
 * `alt` is localized so bilingual alt text is served per locale. Sharp generates
 * responsive sizes consumed by next/image.
 */
export const Media: CollectionConfig = {
  slug: "media",
  access: {
    // Public read so the storefront (REST/next-image) can load media.
    read: () => true,
  },
  upload: {
    mimeTypes: ["image/*"],
    imageSizes: [
      { name: "thumbnail", width: 400, height: 300, position: "centre" },
      { name: "card", width: 768, height: 576, position: "centre" },
      { name: "hero", width: 1600, height: 900, position: "centre" },
    ],
    focalPoint: true,
  },
  fields: [
    {
      name: "alt",
      type: "text",
      localized: true,
    },
  ],
};
