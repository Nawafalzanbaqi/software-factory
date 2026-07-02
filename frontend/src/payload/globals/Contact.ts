import type { GlobalConfig } from "payload";

/**
 * Contact global — editorial copy shown alongside the contact form (the form
 * submits to the .NET backend POST /api/v1/contact). Localized headings/body.
 *
 * Note: lib/cms exposes no getContactContent fetcher today (the stub signatures
 * must not change); this global is authored-ready for when that fetcher is added.
 */
export const Contact: GlobalConfig = {
  slug: "contact",
  access: {
    read: () => true,
  },
  fields: [
    {
      name: "heading",
      type: "text",
      localized: true,
    },
    {
      name: "subheading",
      type: "textarea",
      localized: true,
    },
    {
      name: "email",
      type: "email",
    },
    {
      name: "phone",
      type: "text",
    },
    {
      name: "address",
      type: "textarea",
      localized: true,
    },
    {
      name: "mapUrl",
      type: "text",
    },
    {
      // Optional, non-breaking. Handy for the restaurant vertical (orders/
      // reservations via WhatsApp). Existing fetchers ignore it.
      name: "whatsapp",
      type: "text",
    },
  ],
};
