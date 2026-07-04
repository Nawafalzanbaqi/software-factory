import { getTranslations } from "next-intl/server";
import { ArrowRight } from "lucide-react";
import { Link } from "@/lib/i18n/navigation";
import { Button } from "@/components/ui/button";
import { productsApi, ProductGrid } from "@/features/products";

/**
 * Homepage "productListing" section — a featured slice of the catalog. Reuses the
 * products feature api + grid. Below-the-fold; degrades to nothing on API failure.
 */
export async function FeaturedProductsSection() {
  // Kick the API call off first so it isn't serialized behind translations.
  const productsPromise = productsApi
    .list({ sort: "newest", pageSize: 8 })
    .catch(() => null);
  const [t, tc] = await Promise.all([
    getTranslations("products"),
    getTranslations("common"),
  ]);

  const products = (await productsPromise)?.items ?? [];
  if (products.length === 0) return null;

  return (
    <section aria-labelledby="featured-heading" className="container section-y">
      <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
        <div className="max-w-xl">
          <div aria-hidden="true" className="kicker mb-4" />
          <h2
            id="featured-heading"
            className="font-display text-2xl font-semibold sm:text-3xl"
          >
            {t("title")}
          </h2>
          <p className="mt-2 text-muted-foreground">{t("subtitle")}</p>
        </div>
        <Button asChild variant="outline" className="shrink-0">
          <Link href="/products">
            {tc("viewAll")}
            {/* Disambiguates the accessible name from the other "view all" links. */}
            <span className="sr-only">{t("title")}</span>
            <ArrowRight className="size-4 rtl:rotate-180" aria-hidden="true" />
          </Link>
        </Button>
      </div>
      <ProductGrid products={products} />
    </section>
  );
}
