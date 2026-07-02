import { apiClient } from "@/lib/api/client";
import type { PagedResult } from "@/lib/api/types";
import type { MenuCategoryDto, MenuItemDto, MenuQuery } from "../types";

/**
 * Restaurant menu data access (PHASE2.md §3 REST contract, base /api/v1). Server
 * Components call these; ISR revalidation is set per call so the menu stays fresh
 * without SSR cost. All calls degrade to empty/null at the call site on failure.
 */
const LIST_REVALIDATE = 300; // 5 min ISR for categories + item listings
const DETAIL_REVALIDATE = 600; // 10 min ISR for item detail pages

export const menuApi = {
  /** GET /menu/categories -> MenuCategoryDto[] */
  categories: () =>
    apiClient.get<MenuCategoryDto[]>("/menu/categories", {
      next: { revalidate: LIST_REVALIDATE, tags: ["menu-categories"] },
    }),

  /** GET /menu/items?category=&search=&page=&pageSize=&sort= */
  items: (query: MenuQuery = {}) =>
    apiClient.get<PagedResult<MenuItemDto>>("/menu/items", {
      query: {
        category: query.category,
        search: query.search,
        page: query.page,
        pageSize: query.pageSize,
        sort: query.sort,
      },
      next: { revalidate: LIST_REVALIDATE, tags: ["menu-items"] },
    }),

  /** GET /menu/items/{slug} -> MenuItemDto */
  getBySlug: (slug: string) =>
    apiClient.get<MenuItemDto>(`/menu/items/${slug}`, {
      next: { revalidate: DETAIL_REVALIDATE, tags: [`menu-item:${slug}`] },
    }),

  /** All item slugs for generateStaticParams (SSG). Falls back to [] on failure. */
  allSlugs: async (): Promise<string[]> => {
    try {
      const res = await apiClient.get<PagedResult<MenuItemDto>>("/menu/items", {
        query: { pageSize: 1000 },
        next: { revalidate: LIST_REVALIDATE },
      });
      return res.items.map((i) => i.slug);
    } catch {
      return [];
    }
  },
};
