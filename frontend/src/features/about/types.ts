import type { AboutContent } from "@/lib/cms/types";
import type { Locale } from "@/lib/i18n/routing";

export type { AboutContent };

/**
 * Split rich body copy (CMS `AboutContent.body` or an i18n fallback string) into
 * paragraphs on blank lines. Keeps components free of ad-hoc string wrangling and
 * lets both the CMS body and the messages fallback share one rendering path.
 */
export function toParagraphs(body: string): string[] {
  return body
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
}

/** Locale-aware display fields for CMS About content. */
export function localizeAbout(content: AboutContent, locale: Locale) {
  return {
    title: content.title[locale],
    paragraphs: toParagraphs(content.body[locale]),
    imageUrl: content.image?.url,
    imageAlt: content.image?.alt[locale],
  };
}
