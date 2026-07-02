import { getTranslations } from "next-intl/server";
import { Link } from "@/lib/i18n/navigation";
import { Button } from "@/components/ui/button";
import { isSectionEnabled } from "@/lib/config/options";
import { menuApi } from "../api/menuApi";
import type { MenuCategoryDto, MenuItemDto } from "../types";
import { CategoryChips } from "./CategoryChips";
import { MenuGrid } from "./MenuGrid";

/**
 * Homepage "menu" section (Server Component) — featured items grid + category
 * chips. Reuses the menu feature api + grid. Below-the-fold; returns null when the
 * section is disabled or the backend has nothing to show (degrades cleanly).
 */
export async function MenuSection() {
  if (!(await isSectionEnabled("menu"))) return null;

  const t = await getTranslations("menu");

  let categories: MenuCategoryDto[] = [];
  let items: MenuItemDto[] = [];
  try {
    const [cats, itemsResult] = await Promise.all([
      menuApi.categories(),
      menuApi.items({ sort: "newest", pageSize: 6 }),
    ]);
    categories = cats;
    items = itemsResult.items;
  } catch {
    categories = [];
    items = [];
  }

  if (items.length === 0) return null;

  return (
    <section aria-labelledby="menu-section-heading" className="container section-y">
      <div className="mb-8 flex items-end justify-between">
        <div className="space-y-1">
          <h2
            id="menu-section-heading"
            className="font-display text-2xl font-semibold"
          >
            {t("sectionTitle")}
          </h2>
          <p className="text-sm text-muted-foreground">{t("sectionSubtitle")}</p>
        </div>
        <Button asChild variant="link">
          <Link href="/menu">{t("viewFullMenu")}</Link>
        </Button>
      </div>
      {categories.length > 0 && (
        <div className="mb-6">
          <CategoryChips categories={categories} />
        </div>
      )}
      <MenuGrid items={items} />
    </section>
  );
}
