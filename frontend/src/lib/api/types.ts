/**
 * Shared DTO types — MUST match ARCHITECTURE.md §2 "DTO shapes" exactly so the
 * frontend and .NET backend agree on the wire format.
 *
 * NOTE: These are hand-written to unblock development. Once the backend emits
 * openapi.json, run `npm run gen:api` (openapi-typescript) to produce
 * src/lib/api/openapi.ts and switch these aliases to the generated types.
 */

export interface ProductDto {
  id: string;
  slug: string;
  nameEn: string;
  nameAr: string;
  descriptionEn: string;
  descriptionAr: string;
  price: number;
  currency: string;
  compareAtPrice?: number;
  categoryId: string;
  images: string[];
  inStock: boolean;
  rating?: number;
  /** Number of ratings behind `rating`. Required by schema.org AggregateRating —
   *  when absent the JSON-LD aggregateRating block is omitted (see lib/seo/jsonld).
   *  TODO (backlog): populate from the backend once Reviews (features.reviews) ships. */
  ratingCount?: number;
  tags: string[];
}

export interface CategoryDto {
  id: string;
  slug: string;
  nameEn: string;
  nameAr: string;
  imageUrl?: string;
  productCount: number;
}

export interface CartItemDto {
  id: string;
  productId: string;
  slug: string;
  nameEn: string;
  nameAr: string;
  price: number;
  quantity: number;
  imageUrl: string;
  lineTotal: number;
}

export interface CartDto {
  id: string;
  items: CartItemDto[];
  subtotal: number;
  currency: string;
}

export interface OrderItemDto {
  productId: string;
  nameEn: string;
  nameAr: string;
  price: number;
  quantity: number;
}

export interface OrderDto {
  orderNumber: string;
  status: string;
  items: OrderItemDto[];
  total: number;
  currency: string;
  placedAt: string;
}

export interface OrderTrackingDto {
  orderNumber: string;
  status: string;
  timeline: { status: string; at: string }[];
}

export interface ReviewDto {
  id: string;
  productId: string;
  author: string;
  rating: number;
  title: string;
  body: string;
  createdAt: string;
}

/** Standard paginated list envelope for GET /products. */
export interface PagedResult<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
}

/** Query params for GET /api/v1/products. */
export interface ProductQuery {
  category?: string;
  search?: string;
  page?: number;
  pageSize?: number;
  sort?: "newest" | "priceAsc" | "priceDesc" | "rating";
}

/** Body for POST /api/v1/checkout. */
export interface CheckoutRequest {
  cartId: string;
  customer: { name: string; email: string; phone?: string };
  shippingAddress: {
    line1: string;
    line2?: string;
    city: string;
    country: string;
    postalCode?: string;
  };
  paymentMethod: string;
}
