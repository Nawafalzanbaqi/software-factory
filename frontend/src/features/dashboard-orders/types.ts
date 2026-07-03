import type {
  ManagedOrderDto,
  ManagedOrderListItem,
  ManagedOrdersPage,
} from "@/lib/api/types";

export type { ManagedOrderDto, ManagedOrderListItem, ManagedOrdersPage };

/**
 * Backend OrderStatus enum NAMES — the wire values accepted by
 * POST /api/v1/manage/orders/{n}/status (Domain/Shared/Ordering/OrderStatus.cs;
 * the backend validator rejects anything else). Display labels come from the
 * existing `orders.status.*` catalog via normalizeStatus().
 */
export const MANAGED_ORDER_STATUSES = [
  "Pending",
  "Paid",
  "Processing",
  "Shipped",
  "Delivered",
  "Cancelled",
] as const;
export type ManagedOrderStatus = (typeof MANAGED_ORDER_STATUSES)[number];
