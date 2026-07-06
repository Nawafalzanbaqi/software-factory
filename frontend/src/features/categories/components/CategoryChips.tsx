import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/lib/i18n/navigation";
import { cn } from "@/lib/utils";
import type { Locale } from "@/lib/i18n/routing";
import type { CategoryDto } from "@/lib/api/types";
import { categoriesApi } from "../api/categoriesApi";
import { localizeCategory } from "../types";

/**
 * Category filter chips for the product listing (Server Component). Links write
 * `?category=<slug>` (preserving sort/search) so the listing Server Component
 * re-fetches — same URL-as-state pattern as ProductFilters. Degrades to nothing
 * when the taxonomy is empty/unreachable. Composed by the /products PAGE next to
 * ProductListing — features never import each other's internals.
 */
export async function CategoryChips({
  activeCategory,
  currentSort,
  currentSearch,
}: {
  activeCategory?: string;
  currentSort?: string;
  currentSearch?: string;
}) {
  // Kick the API call off first so it isn't serialized behind locale/messages.
  const categoriesPromise = categoriesApi.list().catch(() => null);
  const [locale, t] = await Promise.all([
    getLocale() as Promise<Locale>,
    getTranslations("categories"),
  ]);

  const categories: CategoryDto[] = (await categoriesPromise) ?? [];
  if (categories.length === 0) return null;

  const hrefFor = (slug?: string) => {
    const params = new URLSearchParams();
    if (slug) params.set("category", slug);
    if (currentSort) params.set("sort", currentSort);
    if (currentSearch) params.set("search", currentSearch);
    const qs = params.toString();
    return qs ? `/products?${qs}` : "/products";
  };

  const chipClass = (active: boolean) =>
    cn(
      "inline-flex h-9 shrink-0 items-center whitespace-nowrap rounded-full border px-4 text-sm font-medium transition-colors",
      active
        ? "border-primary bg-primary text-primary-foreground"
        : "border-border bg-card text-foreground/80 hover:border-accent-strong/40 hover:text-foreground",
    );

  return (
    <nav aria-label={t("title")}>
      <ul className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] sm:flex-wrap [&::-webkit-scrollbar]:hidden">
        <li>
          <Link
            href={hrefFor(undefined)}
            aria-current={!activeCategory ? "true" : undefined}
            className={chipClass(!activeCategory)}
          >
            {t("all")}
          </Link>
        </li>
        {categories.map((category) => {
          const { name } = localizeCategory(category, locale);
          const active = activeCategory === category.slug;
          return (
            <li key={category.id}>
              <Link
                href={hrefFor(category.slug)}
                aria-current={active ? "true" : undefined}
                className={chipClass(active)}
              >
                {name}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
