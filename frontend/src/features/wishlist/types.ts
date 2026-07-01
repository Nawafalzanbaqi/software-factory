import type { ProductDto } from "@/lib/api/types";
import type { Locale } from "@/lib/i18n/routing";

/**
 * The wishlist lists saved products. ARCHITECTURE.md does not define a dedicated
 * WishlistDto, so we reuse the shared ProductDto (the wishlist's DELETE key is the
 * product id, and POST takes { productId }) — no invented fields.
 */
export type { ProductDto };

/** A saved product as returned by GET /api/v1/wishlist. */
export type WishlistProduct = ProductDto;

/** Locale-aware display fields for a wishlisted product. */
export function localizeProduct(product: ProductDto, locale: Locale) {
  return {
    name: locale === "ar" ? product.nameAr : product.nameEn,
    description: locale === "ar" ? product.descriptionAr : product.descriptionEn,
  };
}
