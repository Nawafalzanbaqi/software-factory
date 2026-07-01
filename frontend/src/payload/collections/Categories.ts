import type { CollectionConfig } from "payload";

/**
 * Product categories. Editorial fields mirror CategoryDto (slug, name, image);
 * `name`/`description` are localized (en/ar). `productCount` in the DTO is derived
 * at read time by the backend, so it is not stored here.
 */
export const Categories: CollectionConfig = {
  slug: "categories",
  access: {
    read: () => true,
  },
  admin: {
    useAsTitle: "name",
    defaultColumns: ["name", "slug"],
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
      name: "image",
      type: "upload",
      relationTo: "media",
    },
  ],
};
