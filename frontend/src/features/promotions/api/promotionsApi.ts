import "server-only";
import { getPromotions } from "@/lib/cms";
import type { CmsLocale, PromotionContent } from "@/lib/cms";

/**
 * Promotions data access. Copy + media are CMS-driven (Payload `promotions`
 * collection, PHASE2 §4) — the frontend imports ONLY from `lib/cms` so swapping the
 * stub for live Payload queries is a single-module change. No backend involved.
 *
 * `getPromotions` returns `[]` when the CMS is disabled/unreachable or on any error,
 * so the homepage section and page degrade gracefully (render an empty state or
 * nothing) rather than throwing.
 */
export const promotionsApi = {
  list: async (locale: CmsLocale = "all"): Promise<PromotionContent[]> => {
    try {
      return await getPromotions(locale);
    } catch {
      return [];
    }
  },
};
