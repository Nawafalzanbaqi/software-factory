import type { GlobalConfig } from "payload";

/**
 * Footer global — maps to the FooterContent type (optional tagline + link
 * columns). Column titles and link labels are localized (en/ar); hrefs are plain.
 */
export const Footer: GlobalConfig = {
  slug: "footer",
  access: {
    read: () => true,
  },
  fields: [
    {
      name: "tagline",
      type: "text",
      localized: true,
    },
    {
      name: "columns",
      type: "array",
      fields: [
        {
          name: "title",
          type: "text",
          required: true,
          localized: true,
        },
        {
          name: "links",
          type: "array",
          fields: [
            {
              name: "label",
              type: "text",
              required: true,
              localized: true,
            },
            {
              name: "href",
              type: "text",
              required: true,
            },
          ],
        },
      ],
    },
  ],
};
