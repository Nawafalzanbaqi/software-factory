import type { CollectionConfig } from "payload";

/**
 * Products. Editorial fields mirror ProductDto (slug, name, description, images,
 * price, compareAtPrice, currency, category, inStock, rating, tags). Text fields
 * (`name`, `description`) are localized (en/ar). Pricing/stock are canonical in
 * the .NET backend; these mirror them for CMS-authored/reference content.
 */
export const Products: CollectionConfig = {
  slug: "products",
  access: {
    read: () => true,
  },
  admin: {
    useAsTitle: "name",
    defaultColumns: ["name", "slug", "price", "inStock"],
  },
  fields: [
    {
      name: "slug",
      type: "text",
      required: true,
      unique: true,
      index: true,
    },
    {
      name: "name",
      type: "text",
      required: true,
      localized: true,
    },
    {
      name: "description",
      type: "textarea",
      localized: true,
    },
    {
      name: "images",
      type: "upload",
      relationTo: "media",
      hasMany: true,
    },
    {
      name: "category",
      type: "relationship",
      relationTo: "categories",
    },
    {
      // Optional here — canonical price lives in the backend catalog.
      name: "price",
      type: "number",
      min: 0,
    },
    {
      name: "compareAtPrice",
      type: "number",
      min: 0,
    },
    {
      name: "currency",
      type: "text",
      defaultValue: "SAR",
    },
    {
      name: "inStock",
      type: "checkbox",
      defaultValue: true,
    },
    {
      name: "rating",
      type: "number",
      min: 0,
      max: 5,
    },
    {
      name: "tags",
      type: "text",
      hasMany: true,
    },
  ],
};
