import type { CollectionConfig } from "payload";

/**
 * Menu categories (restaurant vertical). Editorial fields mirror MenuCategoryDto
 * (slug, nameEn/nameAr, imageUrl?, itemCount). `name`/`description` are localized
 * (en/ar). `itemCount` in the DTO is derived at read time by the backend, so it is
 * not stored here.
 *
 * TODO(phase-3): multi-tenant — scope categories per tenant/brand.
 */
export const MenuCategory: CollectionConfig = {
  slug: "menuCategories",
  access: {
    read: () => true,
  },
  admin: {
    useAsTitle: "name",
    defaultColumns: ["name", "slug", "order"],
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
    {
      name: "order",
      type: "number",
      defaultValue: 0,
      index: true,
    },
  ],
};
