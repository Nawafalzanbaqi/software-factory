import type { ProductDto } from "@/lib/api/types";

/** A line item held in the client cart store. */
export interface CartLine {
  productId: string;
  slug: string;
  nameEn: string;
  nameAr: string;
  price: number;
  currency: string;
  imageUrl: string;
  quantity: number;
}

/** Minimal product shape needed to add to cart (subset of ProductDto). */
export type AddToCartInput = Pick<
  ProductDto,
  "id" | "slug" | "nameEn" | "nameAr" | "price" | "currency"
> & { imageUrl: string };

export interface CartState {
  lines: CartLine[];
  add: (product: AddToCartInput, quantity?: number) => void;
  remove: (productId: string) => void;
  setQuantity: (productId: string, quantity: number) => void;
  clear: () => void;
}
