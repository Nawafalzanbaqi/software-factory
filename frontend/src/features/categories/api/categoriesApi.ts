import { apiClient } from "@/lib/api/client";
import type { CategoryDto } from "@/lib/api/types";

/**
 * Categories data access (ARCHITECTURE.md §2 REST contract: GET /api/v1/categories).
 * Server Components call this; ISR revalidation is set per call so the taxonomy
 * stays fresh while remaining Redis/CDN cache friendly (categories change rarely,
 * so the window is longer than the products listing window).
 */
const LIST_REVALIDATE = 3600; // 1h ISR — categories are slow-moving reference data.

export const categoriesApi = {
  /** All categories. Callers degrade to [] on failure (see CategoryGrid). */
  list: () =>
    apiClient.get<CategoryDto[]>("/categories", {
      next: { revalidate: LIST_REVALIDATE, tags: ["categories"] },
    }),
};
