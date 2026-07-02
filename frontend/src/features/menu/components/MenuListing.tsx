import { getTranslations } from "next-intl/server";
import { menuApi } from "../api/menuApi";
import type { MenuCategoryDto, MenuItemDto } from "../types";
import { CategoryChips } from "./CategoryChips";
import { MenuGrid } from "./MenuGrid";

/**
 * Server Component menu listing (the /menu page body). Fetches categories + items
 * via the api client (ISR) and renders the category chips + grid. The active
 * category is read from the URL (?category). Degrades to empty rather than throwing.
 */
export async function MenuListing({ category }: { category?: string }) {
  const t = await getTranslations("menu");

  let categories: MenuCategoryDto[] = [];
  let items: MenuItemDto[] = [];
  try {
    const [cats, itemsResult] = await Promise.all([
      menuApi.categories(),
      menuApi.items({ category, pageSize: 48 }),
    ]);
    categories = cats;
    items = itemsResult.items;
  } catch {
    categories = [];
    items = [];
  }

  return (
    <section aria-labelledby="menu-heading" className="space-y-6">
      <div className="space-y-1">
        <h1 id="menu-heading" className="font-display text-2xl font-semibold">
          {t("title")}
        </h1>
        <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
      </div>
      <CategoryChips categories={categories} activeCategory={category} />
      <MenuGrid items={items} />
    </section>
  );
}
