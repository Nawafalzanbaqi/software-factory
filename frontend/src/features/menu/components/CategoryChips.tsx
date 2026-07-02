import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/lib/i18n/navigation";
import { cn } from "@/lib/utils";
import type { Locale } from "@/lib/i18n/routing";
import type { MenuCategoryDto } from "../types";
import { localizeMenuCategory } from "../types";

/**
 * Server Component category filter as locale-aware links (no client JS needed).
 * Each chip navigates to /menu?category=<slug>; the active chip is highlighted.
 * An "All" chip clears the filter.
 */
export async function CategoryChips({
  categories,
  activeCategory,
}: {
  categories: MenuCategoryDto[];
  activeCategory?: string;
}) {
  const locale = (await getLocale()) as Locale;
  const t = await getTranslations("menu");

  if (categories.length === 0) return null;

  const chip =
    "inline-flex items-center gap-1.5 rounded-full border px-4 py-1.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

  return (
    <nav aria-label={t("categoriesAria")}>
      <ul className="flex flex-wrap gap-2">
        <li>
          <Link
            href="/menu"
            aria-current={!activeCategory ? "page" : undefined}
            className={cn(
              chip,
              !activeCategory
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-background hover:bg-muted",
            )}
          >
            {t("allCategories")}
          </Link>
        </li>
        {categories.map((category) => {
          const { name } = localizeMenuCategory(category, locale);
          const isActive = activeCategory === category.slug;
          return (
            <li key={category.id}>
              <Link
                href={`/menu?category=${encodeURIComponent(category.slug)}`}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  chip,
                  isActive
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-background hover:bg-muted",
                )}
              >
                <span>{name}</span>
                <span className="tabular-nums opacity-70">{category.itemCount}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
