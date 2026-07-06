import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { setRequestLocale, getTranslations } from "next-intl/server";
import type { Locale } from "@/lib/i18n/routing";
import { buildMetadata } from "@/lib/seo/metadata";
import { getSiteType, isSectionEnabled } from "@/lib/config/options";
import { ProductListing } from "@/features/products";
import type { SortOption } from "@/features/products";
import { categoriesApi, CategoryChips } from "@/features/categories";

// ISR: the listing shell is static; the ProductListing server component fetches
// with its own revalidate window. Search/sort are read from the URL.
export const revalidate = 300;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "products" });
  return buildMetadata({
    locale,
    title: t("title"),
    description: t("subtitle"),
    path: "/products",
  });
}

export default async function ProductsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: Locale }>;
  searchParams: Promise<{ sort?: string; search?: string; category?: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  // Ecommerce-only route.
  if ((await getSiteType()) !== "ecommerce") notFound();
  const sp = await searchParams;
  // Chips honor the same options.json flag as the categories nav + homepage
  // section — a build without categories shows no taxonomy UI anywhere.
  const categoriesEnabled = await isSectionEnabled("categories");
  if (categoriesEnabled) {
    // Warm the taxonomy fetch NOW so it runs in parallel with the products
    // fetch inside ProductListing — CategoryChips' identical call joins this
    // in-flight request via Next's per-render fetch memoization.
    void categoriesApi.list().catch(() => {});
  }

  return (
    <div className="container section-y">
      <ProductListing
        sort={sp.sort as SortOption | undefined}
        search={sp.search}
        category={sp.category}
        // Cross-feature composition happens here at the page level: the
        // categories feature supplies the filter chips as a slot.
        filterSlot={
          categoriesEnabled ? (
            <CategoryChips
              activeCategory={sp.category}
              currentSort={sp.sort}
              currentSearch={sp.search}
            />
          ) : undefined
        }
      />
    </div>
  );
}
