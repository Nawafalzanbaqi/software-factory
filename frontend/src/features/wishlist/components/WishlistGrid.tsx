import type { ProductDto } from "@/lib/api/types";
import { WishlistItemCard } from "./WishlistItemCard";

/** Responsive, mobile-first wishlist grid (Server Component). */
export function WishlistGrid({ products }: { products: ProductDto[] }) {
  return (
    <ul className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-3 xl:grid-cols-4">
      {products.map((product) => (
        <li key={product.id}>
          <WishlistItemCard product={product} />
        </li>
      ))}
    </ul>
  );
}
