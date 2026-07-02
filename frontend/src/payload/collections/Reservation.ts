import type { CollectionConfig } from "payload";

/**
 * Table reservations (restaurant vertical). Mirrors ReservationDto (reference,
 * branchId, status, partySize, dateTime, customerName, createdAt) plus the POST
 * /reservations request body (customer{name,email,phone}, tableId?, notes?). User-
 * generated / operational data, so NOT localized. The canonical reservation flow
 * lives in the .NET backend; this collection mirrors it for CMS visibility/authoring.
 *
 * TODO(phase-3): multi-tenant — scope reservations per tenant/brand.
 */
export const Reservation: CollectionConfig = {
  slug: "reservations",
  access: {
    read: () => true,
  },
  admin: {
    useAsTitle: "reference",
    defaultColumns: ["reference", "branch", "partySize", "dateTime", "status"],
  },
  fields: [
    {
      name: "reference",
      type: "text",
      required: true,
      unique: true,
      index: true,
    },
    {
      name: "branch",
      type: "relationship",
      relationTo: "branches",
      index: true,
    },
    {
      name: "table",
      type: "relationship",
      relationTo: "restaurantTables",
    },
    {
      name: "customer",
      type: "group",
      fields: [
        { name: "name", type: "text", required: true },
        { name: "email", type: "email" },
        { name: "phone", type: "text" },
      ],
    },
    {
      name: "partySize",
      type: "number",
      min: 1,
      defaultValue: 2,
    },
    {
      name: "dateTime",
      type: "date",
      admin: { date: { pickerAppearance: "dayAndTime" } },
    },
    {
      name: "status",
      type: "select",
      defaultValue: "pending",
      options: [
        { label: "Pending", value: "pending" },
        { label: "Confirmed", value: "confirmed" },
        { label: "Seated", value: "seated" },
        { label: "Cancelled", value: "cancelled" },
      ],
    },
    {
      name: "notes",
      type: "textarea",
    },
  ],
};
