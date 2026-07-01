import { apiClient } from "@/lib/api/client";
import type { ProductDto } from "@/lib/api/types";

/**
 * Wishlist data access (ARCHITECTURE.md §2 REST contract). All endpoints are
 * auth-gated: callers pass the backend bearer token (obtained server-side via
 * `getAccessToken()`), which the api client forwards as `Authorization: Bearer`.
 *
 * The wishlist is per-user and never cached (`no-store`).
 */
export const wishlistApi = {
  /** GET /api/v1/wishlist — the current user's saved products. */
  list: (token: string) =>
    apiClient.get<ProductDto[]>("/wishlist", { token, cache: "no-store" }),

  /** POST /api/v1/wishlist/items — add a product to the wishlist. */
  add: (productId: string, token: string) =>
    apiClient.post<void>("/wishlist/items", { productId }, { token, cache: "no-store" }),

  /** DELETE /api/v1/wishlist/items/{productId} — remove a product. */
  remove: (productId: string, token: string) =>
    apiClient.delete<void>(`/wishlist/items/${productId}`, {
      token,
      cache: "no-store",
    }),
};
