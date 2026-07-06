import { getTranslations } from "next-intl/server";
import { PackageSearch } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import type { ProductDto } from "@/lib/api/types";
import { ProductCard } from "./ProductCard";

/** Responsive, mobile-first product grid (Server Component). */
export async function ProductGrid({ products }: { products: ProductDto[] }) {
  const t = await getTranslations("products");

  if (products.length === 0) {
    return (
      <EmptyState icon={<PackageSearch className="size-6" />} message={t("empty")} />
    );
  }

  return (
    <ul className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-3 xl:grid-cols-4">
      {products.map((product) => (
        <li key={product.id}>
          {/* ProductCard is async — allowed as a child element. */}
          <ProductCard product={product} />
        </li>
      ))}
    </ul>
  );
}
