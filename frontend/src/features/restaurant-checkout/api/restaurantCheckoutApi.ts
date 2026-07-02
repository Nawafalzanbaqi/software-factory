import { apiClient } from "@/lib/api/client";
import type {
  BranchDto,
  PlaceFoodOrderRequest,
  PlaceFoodOrderResponse,
} from "../types";

/**
 * Restaurant checkout data access (PHASE2.md §3 REST contract):
 *   GET  /api/v1/branches                 -> BranchDto[]   (branch selector)
 *   POST /api/v1/checkout  (food body)    -> { orderNumber }
 *
 * Called from a client leaf (runs in the browser). Branches use no-store here so
 * the selector always reflects the currently open branches; the shared server
 * components can still ISR-cache /branches elsewhere.
 */
export const restaurantCheckoutApi = {
  listBranches: () =>
    apiClient.get<BranchDto[]>("/branches", { cache: "no-store" }),

  create: (payload: PlaceFoodOrderRequest) =>
    apiClient.post<PlaceFoodOrderResponse>("/checkout", payload, {
      cache: "no-store",
    }),
};
