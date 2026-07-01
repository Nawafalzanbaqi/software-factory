import { apiClient } from "@/lib/api/client";
import type { PagedResult, ProductDto, ProductQuery } from "@/lib/api/types";

/**
 * Products data access (ARCHITECTURE.md §2 REST contract). Server Components call
 * these; ISR revalidation is set per call so listings stay fresh without SSR cost.
 */
const LIST_REVALIDATE = 300; // 5 min ISR for listings
const DETAIL_REVALIDATE = 600; // 10 min ISR for detail pages

export const productsApi = {
  list: (query: ProductQuery = {}) =>
    apiClient.get<PagedResult<ProductDto>>("/products", {
      query: {
        category: query.category,
        search: query.search,
        page: query.page,
        pageSize: query.pageSize,
        sort: query.sort,
      },
      next: { revalidate: LIST_REVALIDATE, tags: ["products"] },
    }),

  getBySlug: (slug: string) =>
    apiClient.get<ProductDto>(`/products/${slug}`, {
      next: { revalidate: DETAIL_REVALIDATE, tags: [`product:${slug}`] },
    }),

  /** All slugs for generateStaticParams (SSG). Falls back to [] on failure. */
  allSlugs: async (): Promise<string[]> => {
    try {
      const res = await apiClient.get<PagedResult<ProductDto>>("/products", {
        query: { pageSize: 1000 },
        next: { revalidate: LIST_REVALIDATE },
      });
      return res.items.map((p) => p.slug);
    } catch {
      return [];
    }
  },
};
