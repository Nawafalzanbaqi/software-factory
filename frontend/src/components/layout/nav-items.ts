import "server-only";
import { isFeatureEnabled, isSectionEnabled } from "@/lib/config/options";

/** A resolved nav entry. `href` is locale-agnostic (Link adds the prefix). */
export interface NavItem {
  /** i18n key under `nav.*`. */
  labelKey: string;
  href: string;
  /** Requires an authenticated session to show. */
  authOnly?: boolean;
}

/**
 * Build the primary nav from options.json — an item only appears when its backing
 * section/feature flag is on. Keeps the header in lock-step with what is built.
 */
export async function getPrimaryNav(): Promise<NavItem[]> {
  const items: NavItem[] = [{ labelKey: "home", href: "/" }];

  if (await isSectionEnabled("productListing")) {
    items.push({ labelKey: "products", href: "/products" });
  }
  if (await isSectionEnabled("categories")) {
    items.push({ labelKey: "categories", href: "/categories" });
  }
  if (await isSectionEnabled("about")) {
    items.push({ labelKey: "about", href: "/about" });
  }
  if (await isSectionEnabled("faq")) {
    items.push({ labelKey: "faq", href: "/faq" });
  }
  if (await isSectionEnabled("contact")) {
    items.push({ labelKey: "contact", href: "/contact" });
  }
  return items;
}

/**
 * Utility/account nav filtered by feature flags. `authOnly` items are shown only
 * to authenticated visitors — enforcement lives in the client nav surfaces
 * (AccountMenu, MobileNav) via `useSession`, which keeps the header statically
 * renderable (no cookies read on the server). Search is intentionally excluded
 * here: it has its own SearchBar UI in the header.
 */
export async function getUtilityNav(): Promise<NavItem[]> {
  const items: NavItem[] = [];
  // Order tracking by number is public (no session required).
  if (await isFeatureEnabled("orderTracking")) {
    items.push({ labelKey: "orders", href: "/orders" });
  }
  if (await isFeatureEnabled("wishlist")) {
    items.push({ labelKey: "wishlist", href: "/wishlist", authOnly: true });
  }
  if (await isFeatureEnabled("clientDashboard")) {
    items.push({ labelKey: "dashboard", href: "/dashboard", authOnly: true });
  }
  return items;
}
