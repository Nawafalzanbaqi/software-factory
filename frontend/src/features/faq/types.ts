import type { FaqItem } from "@/lib/cms/types";
import type { Locale } from "@/lib/i18n/routing";

export type { FaqItem };

/**
 * A localized, display-ready FAQ entry: bilingual CMS text resolved to a single
 * locale. This is the shape the accordion + JSON-LD builders consume.
 */
export interface FaqEntry {
  id: string;
  question: string;
  answer: string;
}

/** Shape of a fallback FAQ item stored in the i18n message catalog (faq.items). */
export interface FaqMessageItem {
  question: string;
  answer: string;
}

/** Resolve bilingual CMS FAQ items (lib/cms) to the active locale. */
export function localizeFaqItems(items: FaqItem[], locale: Locale): FaqEntry[] {
  return items.map((item) => ({
    id: item.id,
    question: item.question[locale],
    answer: item.answer[locale],
  }));
}

/**
 * Build display entries from i18n message items — used as a graceful fallback when
 * the CMS has no FAQ entries yet. Ids are synthesized (messages carry no id).
 */
export function faqEntriesFromMessages(items: FaqMessageItem[]): FaqEntry[] {
  return items.map((item, index) => ({
    id: `faq-msg-${index}`,
    question: item.question,
    answer: item.answer,
  }));
}
