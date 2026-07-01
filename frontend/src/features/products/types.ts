import type { ProductDto } from "@/lib/api/types";
import type { Locale } from "@/lib/i18n/routing";

export type { ProductDto };

/** Locale-aware display fields for a product. */
export function localizeProduct(product: ProductDto, locale: Locale) {
  return {
    name: locale === "ar" ? product.nameAr : product.nameEn,
    description: locale === "ar" ? product.descriptionAr : product.descriptionEn,
  };
}

export const SORT_OPTIONS = ["newest", "priceAsc", "priceDesc", "rating"] as const;
export type SortOption = (typeof SORT_OPTIONS)[number];
