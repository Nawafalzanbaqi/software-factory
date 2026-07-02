import type { Locale } from "@/lib/i18n/routing";

/**
 * Restaurant menu DTOs (PHASE2.md §3). Defined locally in the feature — the
 * shared `src/lib/api/types.ts` is NOT edited by feature agents. These mirror the
 * backend `/api/v1/menu/*` contract (records) exactly.
 */

/** GET /menu/categories -> MenuCategoryDto[] */
export interface MenuCategoryDto {
  id: string;
  slug: string;
  nameEn: string;
  nameAr: string;
  imageUrl?: string;
  itemCount: number;
}

/** GET /menu/items/{slug} and item of PagedResult<MenuItemDto>. */
export interface MenuItemDto {
  id: string;
  slug: string;
  nameEn: string;
  nameAr: string;
  descriptionEn: string;
  descriptionAr: string;
  price: number;
  currency: string;
  categoryId: string;
  images: string[];
  isAvailable: boolean;
  tags: string[];
  spicyLevel?: number;
  calories?: number;
}

/** Sort options accepted by GET /menu/items?sort= (mirrors the catalog contract). */
export const MENU_SORT_OPTIONS = [
  "newest",
  "priceAsc",
  "priceDesc",
] as const;
export type MenuSortOption = (typeof MENU_SORT_OPTIONS)[number];

/** Query params for GET /api/v1/menu/items. */
export interface MenuQuery {
  category?: string;
  search?: string;
  page?: number;
  pageSize?: number;
  sort?: MenuSortOption;
}

/** Locale-aware display fields for a menu item. */
export function localizeMenuItem(item: MenuItemDto, locale: Locale) {
  return {
    name: locale === "ar" ? item.nameAr : item.nameEn,
    description: locale === "ar" ? item.descriptionAr : item.descriptionEn,
  };
}

/** Locale-aware display name for a menu category. */
export function localizeMenuCategory(category: MenuCategoryDto, locale: Locale) {
  return { name: locale === "ar" ? category.nameAr : category.nameEn };
}
