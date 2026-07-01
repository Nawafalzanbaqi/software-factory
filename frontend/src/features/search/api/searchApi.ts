import { apiClient } from "@/lib/api/client";
import type { ProductDto } from "@/lib/api/types";

/**
 * Search data access (ARCHITECTURE.md §2 REST contract):
 * GET /api/v1/search?q= → ProductDto[].
 *
 * Server Components call this. Results are cached with a short revalidate window
 * and a shared tag so catalog changes can invalidate them; per-query URLs keep
 * distinct terms in their own cache entries.
 */
const SEARCH_REVALIDATE = 60; // 1 min ISR — search results tolerate slight staleness

export const searchApi = {
  search: (q: string) =>
    apiClient.get<ProductDto[]>("/search", {
      query: { q },
      next: { revalidate: SEARCH_REVALIDATE, tags: ["search"] },
    }),
};
