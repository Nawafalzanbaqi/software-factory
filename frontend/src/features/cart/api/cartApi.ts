import { apiClient } from "@/lib/api/client";
import type { CartDto } from "@/lib/api/types";

/**
 * Backend cart endpoints (ARCHITECTURE.md §2). Phase 1 UI uses the client store,
 * but these are provided so server-synced carts can be adopted without changing
 * call sites. All shapes match the REST contract exactly.
 */
export const cartApi = {
  get: (cartId: string) =>
    apiClient.get<CartDto>(`/cart/${cartId}`, { cache: "no-store" }),

  addItem: (input: { productId: string; quantity: number }) =>
    apiClient.post<CartDto>("/cart/items", input, { cache: "no-store" }),

  updateItem: (itemId: string, quantity: number) =>
    apiClient.put<CartDto>(`/cart/items/${itemId}`, { quantity }, { cache: "no-store" }),

  removeItem: (itemId: string) =>
    apiClient.delete<CartDto>(`/cart/items/${itemId}`, { cache: "no-store" }),
};
