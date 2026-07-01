import { apiClient } from "@/lib/api/client";
import type { OrderTrackingDto } from "@/lib/api/types";

/**
 * Orders data access (ARCHITECTURE.md §2 REST contract). Order tracking is
 * per-order and changes as fulfillment progresses, so it is fetched fresh
 * (no-store) rather than cached with ISR like the catalog.
 */
export const ordersApi = {
  /**
   * GET /api/v1/orders/{orderNumber}/track — current status + chronological
   * timeline (OrderTrackingDto).
   *
   * TODO (backlog): pass an Auth.js session bearer token for authed order access
   * once sessions are wired (ARCHITECTURE.md §4). Public tracking-by-number stays
   * tokenless.
   */
  track: (orderNumber: string, token?: string) =>
    apiClient.get<OrderTrackingDto>(
      `/orders/${encodeURIComponent(orderNumber)}/track`,
      { cache: "no-store", token },
    ),
};
