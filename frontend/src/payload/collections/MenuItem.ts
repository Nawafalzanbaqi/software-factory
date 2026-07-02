import type { CollectionConfig } from "payload";

/**
 * Menu items (restaurant vertical). Editorial fields mirror MenuItemDto (slug,
 * nameEn/nameAr, descriptionEn/descriptionAr, price, currency, categoryId,
 * images[], isAvailable, tags[], spicyLevel?, calories?). Text fields
 * (`name`, `description`) are localized (en/ar). Pricing/availability are canonical
 * in the .NET backend; these mirror them for CMS-authored/reference content.
 *
 * TODO(phase-3): multi-tenant — scope items per tenant/brand.
 */
export const MenuItem: CollectionConfig = {
  slug: "menuItems",
  access: {
    read: () => true,
  },
  admin: {
    useAsTitle: "name",
    defaultColumns: ["name", "slug", "price", "isAvailable"],
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
      relationTo: "menuCategories",
      index: true,
    },
    {
      // Optional here — canonical price lives in the backend menu module.
      name: "price",
      type: "number",
      min: 0,
    },
    {
      name: "currency",
      type: "text",
      defaultValue: "SAR",
    },
    {
      name: "isAvailable",
      type: "checkbox",
      defaultValue: true,
    },
    {
      name: "tags",
      type: "text",
      hasMany: true,
    },
    {
      // 0 = none, 3 = very spicy.
      name: "spicyLevel",
      type: "number",
      min: 0,
      max: 3,
    },
    {
      name: "calories",
      type: "number",
      min: 0,
    },
  ],
};
