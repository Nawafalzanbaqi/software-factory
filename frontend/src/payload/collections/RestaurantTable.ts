import type { CollectionConfig } from "payload";

/**
 * Restaurant tables (restaurant vertical). Supports the table-reservation flow
 * (PHASE2 §4). A table belongs to a Branch and carries a seating capacity. Not
 * localized — this is operational data, not editorial copy. Reservation
 * availability/state is canonical in the .NET backend; this mirrors the layout for
 * CMS-authored reference content.
 *
 * TODO(phase-3): multi-tenant — scope tables per tenant/brand.
 */
export const RestaurantTable: CollectionConfig = {
  slug: "restaurantTables",
  access: {
    read: () => true,
  },
  admin: {
    useAsTitle: "label",
    defaultColumns: ["label", "branch", "capacity", "isActive"],
  },
  fields: [
    {
      name: "label",
      type: "text",
      required: true,
    },
    {
      name: "branch",
      type: "relationship",
      relationTo: "branches",
      index: true,
    },
    {
      name: "capacity",
      type: "number",
      min: 1,
      defaultValue: 2,
    },
    {
      name: "isActive",
      type: "checkbox",
      defaultValue: true,
    },
  ],
};
