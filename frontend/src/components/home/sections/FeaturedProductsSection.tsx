import { getTranslations } from "next-intl/server";
import { Link } from "@/lib/i18n/navigation";
import { Button } from "@/components/ui/button";
import { productsApi, ProductGrid } from "@/features/products";

/**
 * Homepage "productListing" section — a featured slice of the catalog. Reuses the
 * products feature api + grid. Below-the-fold; degrades to nothing on API failure.
 */
export async function FeaturedProductsSection() {
  const t = await getTranslations("products");

  let products: import("@/lib/api/types").ProductDto[] = [];
  try {
    const res = await productsApi.list({ sort: "newest", pageSize: 8 });
    products = res.items;
  } catch {
    products = [];
  }

  if (products.length === 0) return null;

  return (
    <section aria-labelledby="featured-heading" className="container section-y">
      <div className="mb-8 flex items-end justify-between">
        <h2 id="featured-heading" className="font-display text-2xl font-semibold">
          {t("title")}
        </h2>
        <Button asChild variant="link">
          <Link href="/products">{t("backToProducts")}</Link>
        </Button>
      </div>
      <ProductGrid products={products} />
    </section>
  );
}
