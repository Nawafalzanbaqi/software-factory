import type { CollectionConfig } from "payload";

/**
 * FAQ entries (mirrors FaqItem). `question`/`answer` are localized (en/ar) and
 * served ordered by `order`.
 */
export const Faq: CollectionConfig = {
  slug: "faq",
  access: {
    read: () => true,
  },
  admin: {
    useAsTitle: "question",
    defaultColumns: ["question", "order"],
  },
  fields: [
    {
      name: "question",
      type: "text",
      required: true,
      localized: true,
    },
    {
      name: "answer",
      type: "textarea",
      required: true,
      localized: true,
    },
    {
      name: "order",
      type: "number",
      defaultValue: 0,
      index: true,
    },
  ],
};
