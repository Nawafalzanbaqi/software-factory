import { getTranslations } from "next-intl/server";
import type { ProductDto } from "@/lib/api/types";
import { productsApi } from "../api/productsApi";
import type { SortOption } from "../types";
import { ProductGrid } from "./ProductGrid";
import { ProductFilters } from "./ProductFilters";

/**
 * Server Component listing. Fetches via the api client (ISR) and renders the grid.
 * Sort/search state is read from props (URL search params from the page).
 * On backend failure it degrades to an empty grid rather than throwing.
 */
export async function ProductListing({
  sort,
  search,
  category,
}: {
  sort?: SortOption;
  search?: string;
  category?: string;
}) {
  const t = await getTranslations("products");

  let products: ProductDto[] = [];
  try {
    const result = await productsApi.list({ sort, search, category, pageSize: 24 });
    products = result.items;
  } catch {
    products = [];
  }

  return (
    <section aria-labelledby="listing-heading" className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 id="listing-heading" className="font-display text-2xl font-semibold">
            {t("title")}
          </h1>
          <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
        </div>
        <ProductFilters currentSort={sort} currentSearch={search} />
      </div>
      <ProductGrid products={products} />
    </section>
  );
}
