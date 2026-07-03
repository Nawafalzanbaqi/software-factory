"use server";

import { revalidatePath } from "next/cache";
import { getAccessToken, getDashboardRole } from "@/lib/auth";
import { manageOrdersApi } from "./api/manageOrdersApi";
import { MANAGED_ORDER_STATUSES } from "./types";

/**
 * Server action: advance an order's status from the dashboard. Server actions
 * are public POST endpoints, so authorization happens HERE (session role) and
 * again on the backend (DashboardStaff policy on the minted bearer) — the form
 * being hidden is not a guard.
 */
export async function transitionOrderStatusAction(formData: FormData): Promise<void> {
  const orderNumber = String(formData.get("orderNumber") ?? "").trim();
  const status = String(formData.get("status") ?? "").trim();

  if (!orderNumber || !(MANAGED_ORDER_STATUSES as readonly string[]).includes(status)) {
    return;
  }

  const role = await getDashboardRole();
  if (!role) return;

  const token = await getAccessToken();
  if (!token) return;

  await manageOrdersApi.transition(token, orderNumber, status);

  // Operational pages fetch no-store; revalidate so the action's RSC response
  // re-renders both the list and the detail with the new status.
  revalidatePath("/[locale]/dashboard/orders", "page");
  revalidatePath("/[locale]/dashboard/orders/[orderNumber]", "page");
}
