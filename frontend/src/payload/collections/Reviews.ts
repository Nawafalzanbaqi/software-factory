import type { CollectionConfig } from "payload";

/**
 * Product reviews (mirrors ReviewDto). User-generated content, so NOT localized.
 * Linked to a product by relationship and denormalized `productSlug` for lookups.
 * Gated by `features.reviews` (OFF by default) at the storefront/backend layer.
 */
export const Reviews: CollectionConfig = {
  slug: "reviews",
  access: {
    read: () => true,
  },
  admin: {
    useAsTitle: "title",
    defaultColumns: ["title", "author", "rating", "productSlug"],
  },
  fields: [
    {
      name: "product",
      type: "relationship",
      relationTo: "products",
    },
    {
      name: "productSlug",
      type: "text",
      index: true,
    },
    {
      name: "author",
      type: "text",
      required: true,
    },
    {
      name: "rating",
      type: "number",
      required: true,
      min: 1,
      max: 5,
    },
    {
      name: "title",
      type: "text",
    },
    {
      name: "body",
      type: "textarea",
    },
  ],
};
