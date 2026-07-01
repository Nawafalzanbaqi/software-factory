import type { CategoryDto } from "@/lib/api/types";
import type { Locale } from "@/lib/i18n/routing";

export type { CategoryDto };

/** Locale-aware display name for a category (ARCHITECTURE.md CategoryDto). */
export function localizeCategory(category: CategoryDto, locale: Locale) {
  return {
    name: locale === "ar" ? category.nameAr : category.nameEn,
  };
}
