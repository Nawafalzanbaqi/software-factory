import type { CollectionConfig } from "payload";

/**
 * Restaurant branches (restaurant vertical). Editorial fields mirror BranchDto
 * (slug, nameEn/nameAr, addressEn/addressAr, city, latitude, longitude, phone,
 * openingHours). `name`/`address` are localized (en/ar). `latitude`/`longitude`
 * feed the react-leaflet branch locator map (see PHASE2 §4).
 *
 * TODO(phase-3): multi-tenant — scope branches per tenant/brand.
 */
export const Branch: CollectionConfig = {
  slug: "branches",
  access: {
    read: () => true,
  },
  admin: {
    useAsTitle: "name",
    defaultColumns: ["name", "slug", "city", "phone"],
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
      name: "address",
      type: "textarea",
      localized: true,
    },
    {
      name: "city",
      type: "text",
    },
    {
      name: "latitude",
      type: "number",
    },
    {
      name: "longitude",
      type: "number",
    },
    {
      name: "phone",
      type: "text",
    },
    {
      // Structured weekly hours. Fetcher returns this array as-is on BranchContent.
      name: "openingHours",
      type: "array",
      labels: { singular: "Opening hours row", plural: "Opening hours" },
      fields: [
        {
          name: "day",
          type: "select",
          options: [
            { label: "Monday", value: "mon" },
            { label: "Tuesday", value: "tue" },
            { label: "Wednesday", value: "wed" },
            { label: "Thursday", value: "thu" },
            { label: "Friday", value: "fri" },
            { label: "Saturday", value: "sat" },
            { label: "Sunday", value: "sun" },
          ],
          required: true,
        },
        { name: "opens", type: "text" },
        { name: "closes", type: "text" },
        { name: "closed", type: "checkbox", defaultValue: false },
      ],
    },
  ],
};
