import { getTranslations } from "next-intl/server";
import type { ProductDto } from "@/lib/api/types";
import { ProductCard } from "@/features/products";
import { searchApi } from "../api/searchApi";
import { SearchEmpty } from "./SearchEmpty";

/**
 * Server Component orchestrator for the search results body. Reads the (already
 * resolved) query, fetches via the typed api client, and renders a grid reusing
 * the products ProductCard so cards stay consistent across the store. Degrades
 * to a "no results" state on backend failure rather than throwing.
 *
 * Empty/no-query states are delegated to SearchEmpty.
 */
export async function SearchResults({ query }: { query: string }) {
  const t = await getTranslations("search");
  const q = query.trim();

  if (!q) return <SearchEmpty variant="prompt" />;

  let products: ProductDto[] = [];
  try {
    const res = await searchApi.search(q);
    products = Array.isArray(res) ? res : [];
  } catch {
    products = [];
  }

  if (products.length === 0) return <SearchEmpty variant="noResults" query={q} />;

  return (
    <section aria-labelledby="search-results-heading" className="space-y-6">
      <h2 id="search-results-heading" className="text-sm text-muted-foreground">
        {t("resultsCount", { count: products.length, query: q })}
      </h2>
      <ul className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-3 xl:grid-cols-4">
        {products.map((product) => (
          <li key={product.id}>
            {/* ProductCard is async — allowed as a child element. */}
            <ProductCard product={product} />
          </li>
        ))}
      </ul>
    </section>
  );
}
