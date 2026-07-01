import { getTranslations } from "next-intl/server";
import { Link } from "@/lib/i18n/navigation";
import { Button } from "@/components/ui/button";
import type { CategoryDto } from "@/lib/api/types";
import { categoriesApi } from "../api/categoriesApi";
import { CategoryGrid } from "./CategoryGrid";

/**
 * Homepage "categories" section (Server Component, options.json sectionKey
 * "categories"). Fetches the taxonomy via the api client (ISR) and renders a
 * responsive grid of category cards. Below-the-fold; degrades to nothing on API
 * failure or an empty taxonomy so it never blocks or breaks the homepage.
 *
 * Section gating is handled upstream by HomeSections/getEnabledSections — this
 * feature has no dedicated feature flag (flag-gate: none).
 */
export async function CategoriesSection() {
  const t = await getTranslations("categories");

  let categories: CategoryDto[] = [];
  try {
    categories = await categoriesApi.list();
  } catch {
    categories = [];
  }

  if (categories.length === 0) return null;

  return (
    <section aria-labelledby="categories-heading" className="container section-y">
      <div className="mb-8 flex items-end justify-between gap-4">
        <div>
          <h2
            id="categories-heading"
            className="font-display text-2xl font-semibold"
          >
            {t("sectionTitle")}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">{t("subtitle")}</p>
        </div>
        <Button asChild variant="link">
          <Link href="/categories">{t("viewAll")}</Link>
        </Button>
      </div>
      <CategoryGrid categories={categories} />
    </section>
  );
}
