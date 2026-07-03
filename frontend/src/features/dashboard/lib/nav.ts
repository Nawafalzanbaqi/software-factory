import "server-only";
import { isFeatureEnabled } from "@/lib/config/options";
import { isOwnerRole, type DashboardRole } from "@/lib/auth/roles";

/**
 * Options-driven dashboard nav — an item only exists when its module flag is
 * on (mirrored by scripts/verify-verticals.mjs deriveDashboardNav; keep the
 * two in lock-step). Role filtering: owner-only modules are hidden from staff.
 */
export interface DashboardNavItem {
  /** i18n key under `dashboard.nav.*`. */
  labelKey: "overview" | "orders" | "catalog" | "content" | "users" | "settings";
  href: string;
  ownerOnly?: boolean;
}

export async function getDashboardNav(role?: DashboardRole): Promise<DashboardNavItem[]> {
  if (!(await isFeatureEnabled("clientDashboard"))) return [];

  const items: DashboardNavItem[] = [{ labelKey: "overview", href: "/dashboard" }];

  if (await isFeatureEnabled("dashboardOrders")) {
    items.push({ labelKey: "orders", href: "/dashboard/orders" });
  }
  if (await isFeatureEnabled("dashboardCatalog")) {
    items.push({ labelKey: "catalog", href: "/dashboard/catalog" });
  }
  if ((await isFeatureEnabled("dashboardContent")) && (await isFeatureEnabled("cms"))) {
    items.push({ labelKey: "content", href: "/dashboard/content" });
  }
  if ((await isFeatureEnabled("dashboardUsers")) && isOwnerRole(role)) {
    items.push({ labelKey: "users", href: "/dashboard/users", ownerOnly: true });
  }
  if (await isFeatureEnabled("dashboardSettings")) {
    items.push({ labelKey: "settings", href: "/dashboard/settings" });
  }

  return items;
}
