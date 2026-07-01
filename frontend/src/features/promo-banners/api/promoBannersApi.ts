import "server-only";
import { getPromoBanners } from "@/lib/cms";
import type { PromoBanner } from "@/lib/cms";

/**
 * Promotional banners data access. Copy is CMS-driven (Payload `promoBanners`
 * collection, ARCHITECTURE.md §1) — the frontend imports ONLY from `lib/cms` so
 * swapping the stub for live Payload queries is a single-module change.
 *
 * The CMS stub returns `[]` until Payload is wired up, so the homepage section
 * degrades gracefully (renders nothing). Any fetch error is swallowed to `[]` so a
 * flaky CMS never breaks the homepage render.
 */
export const promoBannersApi = {
  list: async (): Promise<PromoBanner[]> => {
    try {
      return await getPromoBanners();
    } catch {
      return [];
    }
  },
};
