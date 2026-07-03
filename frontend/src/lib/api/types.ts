/**
 * Shared DTO types — MUST match ARCHITECTURE.md §2 "DTO shapes" exactly so the
 * frontend and .NET backend agree on the wire format.
 *
 * Since Phase 4 the backend's openapi.json is generated into
 * src/lib/api/openapi.ts (`npm run gen:api`) and NEW response shapes are
 * DERIVED from it (see the "Derived from OpenAPI" block below) — hand-writing
 * a response shape is a review finding. The Phase 1/2 interfaces below predate
 * the generated contract and are kept as the frozen documented shapes.
 */
import type { components } from "./openapi";

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

/**
 * Standard paginated list envelope (backend `PagedResult<T>`). Field names
 * mirror the generated OpenAPI contract (`OrderDtoPagedResult`): the count is
 * `totalCount` — a hand-written `total` shipped in Phase 1/2 and was never
 * consumed; fixed in Phase 4 when the contract became generated.
 */
export interface PagedResult<T> {
  items: T[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages?: number;
  hasNextPage?: boolean;
  hasPreviousPage?: boolean;
}

// ---------------------------------------------------------------------------
// Derived from OpenAPI (npm run gen:api) — Phase 4 client-dashboard shapes.
// Do not restate these by hand; regenerate openapi.ts when the backend changes.
// ---------------------------------------------------------------------------

/** GET /api/v1/manage/orders — one page of every store order. */
export type ManagedOrdersPage = components["schemas"]["OrderDtoPagedResult"];

/** Items of ManagedOrdersPage (wire-identical to the frozen OrderDto). */
export type ManagedOrderListItem = components["schemas"]["OrderDto"];

/** GET/POST /api/v1/manage/orders/{orderNumber} — staff-facing order detail. */
export type ManagedOrderDto = components["schemas"]["ManagedOrderDto"];

/** POST /api/v1/manage/orders/{orderNumber}/status request body. */
export type TransitionOrderStatusRequest =
  components["schemas"]["TransitionOrderStatusRequest"];

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
