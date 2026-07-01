import type { GlobalConfig } from "payload";

/**
 * About global — maps to the AboutContent type (title, body, optional image).
 * `title`/`body` are localized (en/ar).
 */
export const About: GlobalConfig = {
  slug: "about",
  access: {
    read: () => true,
  },
  fields: [
    {
      name: "title",
      type: "text",
      required: true,
      localized: true,
    },
    {
      name: "body",
      type: "textarea",
      required: true,
      localized: true,
    },
    {
      name: "image",
      type: "upload",
      relationTo: "media",
    },
  ],
};
