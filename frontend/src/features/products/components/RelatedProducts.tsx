import { getTranslations } from "next-intl/server";
import type { ProductDto } from "@/lib/api/types";
import { productsApi } from "../api/productsApi";
import { ProductGrid } from "./ProductGrid";

/**
 * "You may also like" strip for the product detail page (Server Component).
 * Fetches the newest products and excludes the current one — a category-scoped
 * query needs a category SLUG which ProductDto does not carry (only categoryId),
 * so recency is the deliberate, contract-safe heuristic. Degrades to nothing on
 * API failure or when no other products exist.
 */
export async function RelatedProducts({ excludeId }: { excludeId: string }) {
  // Kick the API call off first so it isn't serialized behind translations.
  const productsPromise = productsApi
    .list({ sort: "newest", pageSize: 5 })
    .catch(() => null);
  const t = await getTranslations("products");

  const products: ProductDto[] = ((await productsPromise)?.items ?? [])
    .filter((p) => p.id !== excludeId)
    .slice(0, 4);

  if (products.length === 0) return null;

  return (
    <section aria-labelledby="related-heading">
      <div aria-hidden="true" className="kicker mb-4" />
      <h2
        id="related-heading"
        className="mb-6 font-display text-2xl font-semibold sm:text-3xl"
      >
        {t("relatedTitle")}
      </h2>
      <ProductGrid products={products} />
    </section>
  );
}
