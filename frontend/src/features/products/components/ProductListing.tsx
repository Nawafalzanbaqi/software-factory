import type { ReactNode } from "react";
import { getTranslations } from "next-intl/server";
import { PageHeader } from "@/components/ui/page-header";
import { productsApi } from "../api/productsApi";
import type { SortOption } from "../types";
import { ProductGrid } from "./ProductGrid";
import { ProductFilters } from "./ProductFilters";

/**
 * Server Component listing. Fetches via the api client (ISR) and renders the grid.
 * Sort/search state is read from props (URL search params from the page).
 * On backend failure it degrades to an empty grid rather than throwing.
 *
 * `filterSlot` lets the PAGE compose cross-feature filter UI (e.g. the categories
 * feature's CategoryChips) between the header and the grid without this feature
 * importing another feature's internals.
 */
export async function ProductListing({
  sort,
  search,
  category,
  filterSlot,
}: {
  sort?: SortOption;
  search?: string;
  category?: string;
  filterSlot?: ReactNode;
}) {
  // Kick the API call off first so it isn't serialized behind translations.
  const productsPromise = productsApi
    .list({ sort, search, category, pageSize: 24 })
    .catch(() => null);
  const t = await getTranslations("products");
  const products = (await productsPromise)?.items ?? [];

  return (
    <section aria-labelledby="listing-heading" className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <PageHeader
          title={t("title")}
          subtitle={t("subtitle")}
          headingId="listing-heading"
        />
        <ProductFilters
          currentSort={sort}
          currentSearch={search}
          currentCategory={category}
        />
      </div>
      {filterSlot}
      <ProductGrid products={products} />
    </section>
  );
}
