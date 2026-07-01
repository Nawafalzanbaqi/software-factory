import { getFaqItems } from "@/lib/cms";
import type { Locale } from "@/lib/i18n/routing";
import { localizeFaqItems, type FaqEntry } from "../types";

/**
 * FAQ data access. FAQ copy is CMS-driven (Payload `faq` collection — ARCHITECTURE
 * §1, "content" module). There is NO backend REST endpoint for FAQ, so this reads
 * exclusively through the typed lib/cms fetcher and localizes to the active locale.
 *
 * Returns `[]` when the CMS has no entries (current stub) so Server Component
 * callers can fall back to the i18n `faq.items` message catalog.
 */
export const faqApi = {
  getEntries: async (locale: Locale): Promise<FaqEntry[]> => {
    try {
      const items = await getFaqItems();
      return localizeFaqItems(items, locale);
    } catch {
      return [];
    }
  },
};
