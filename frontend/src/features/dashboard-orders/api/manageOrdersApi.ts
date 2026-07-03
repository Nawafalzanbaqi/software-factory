import "server-only";
import { apiClient } from "@/lib/api/client";
import type { ManagedOrderDto, ManagedOrdersPage } from "../types";

/**
 * Staff order management (Phase 4) — the Shared/Ordering manage endpoints,
 * mapped only when features.clientDashboard is on. Every call is authenticated
 * with the short-lived backend bearer (lib/auth getAccessToken) and fetched
 * fresh: operational data, never ISR-cached.
 */
export const manageOrdersApi = {
  /** GET /api/v1/manage/orders — every store order, newest first. */
  list: (
    token: string,
    query: { page?: number; pageSize?: number; status?: string } = {},
  ) =>
    apiClient.get<ManagedOrdersPage>("/manage/orders", {
      query: {
        page: query.page,
        pageSize: query.pageSize,
        status: query.status,
      },
      cache: "no-store",
      token,
    }),

  /** GET /api/v1/manage/orders/{orderNumber} — staff-facing detail. */
  get: (token: string, orderNumber: string) =>
    apiClient.get<ManagedOrderDto>(
      `/manage/orders/${encodeURIComponent(orderNumber)}`,
      { cache: "no-store", token },
    ),

  /** POST /api/v1/manage/orders/{orderNumber}/status — lifecycle transition. */
  transition: (token: string, orderNumber: string, status: string) =>
    apiClient.post<ManagedOrderDto>(
      `/manage/orders/${encodeURIComponent(orderNumber)}/status`,
      { status },
      { cache: "no-store", token },
    ),
};
