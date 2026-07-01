import type { FaqEntry } from "./types";

/**
 * schema.org FAQPage structured data builder. Render the returned object through
 * the shared <JsonLd /> component (lib/seo). Mirrors the builder style in
 * lib/seo/jsonld.ts (buildProductJsonLd / buildOrganizationJsonLd).
 */
export function buildFaqPageJsonLd(entries: FaqEntry[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: entries.map((entry) => ({
      "@type": "Question",
      name: entry.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: entry.answer,
      },
    })),
  } as const;
}
