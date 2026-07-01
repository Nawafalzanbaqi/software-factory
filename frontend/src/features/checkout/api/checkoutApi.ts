import { apiClient } from "@/lib/api/client";
import type { CheckoutRequest, OrderDto } from "@/lib/api/types";

/**
 * Checkout data access (ARCHITECTURE.md §2 REST contract):
 * POST /api/v1/checkout { cartId, customer, shippingAddress, paymentMethod } -> OrderDto.
 *
 * Submitted from a client leaf (runs in the browser). Never cached — every submit
 * creates a new order.
 */
export const checkoutApi = {
  create: (payload: CheckoutRequest) =>
    apiClient.post<OrderDto>("/checkout", payload, { cache: "no-store" }),
};
