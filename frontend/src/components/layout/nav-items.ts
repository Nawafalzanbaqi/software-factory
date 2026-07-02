import "server-only";
import {
  getSiteType,
  isFeatureEnabled,
  isSectionEnabled,
} from "@/lib/config/options";

/** A resolved nav entry. `href` is locale-agnostic (Link adds the prefix). */
export interface NavItem {
  /** i18n key under `nav.*`. */
  labelKey: string;
  href: string;
  /** Requires an authenticated session to show. */
  authOnly?: boolean;
}

/**
 * Build the primary nav from the active options file — an item only appears when
 * its backing section/feature flag is on. Keeps the header in lock-step with what
 * is built. The item SET is vertical-aware (getSiteType): the restaurant vertical
 * exposes Menu/Reservations/Branches/Gallery, ecommerce keeps Products/Categories.
 */
export async function getPrimaryNav(): Promise<NavItem[]> {
  const siteType = await getSiteType();
  return siteType === "restaurant"
    ? getRestaurantPrimaryNav()
    : getEcommercePrimaryNav();
}

/** Ecommerce (Phase 1) primary nav — UNCHANGED behavior. */
async function getEcommercePrimaryNav(): Promise<NavItem[]> {
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
 * Restaurant (Phase 2) primary nav. Each item is still gated by its own
 * section/feature flag so a partially-configured restaurant hides what it lacks.
 */
async function getRestaurantPrimaryNav(): Promise<NavItem[]> {
  const items: NavItem[] = [{ labelKey: "home", href: "/" }];

  if (await isSectionEnabled("menu")) {
    items.push({ labelKey: "menu", href: "/menu" });
  }
  if (await isFeatureEnabled("reservations")) {
    items.push({ labelKey: "reservations", href: "/reservations" });
  }
  if (await isSectionEnabled("branches")) {
    items.push({ labelKey: "branches", href: "/branches" });
  }
  if (await isSectionEnabled("gallery")) {
    items.push({ labelKey: "gallery", href: "/gallery" });
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
 *
 * Shared across verticals: order tracking (public) + dashboard (authOnly). The
 * restaurant vertical has no wishlist, so that item only appears for ecommerce.
 */
export async function getUtilityNav(): Promise<NavItem[]> {
  const siteType = await getSiteType();
  const items: NavItem[] = [];

  // Order tracking by number is public (no session required).
  if (await isFeatureEnabled("orderTracking")) {
    items.push({ labelKey: "orders", href: "/orders" });
  }
  // Wishlist is an ecommerce-only concept.
  if (siteType !== "restaurant" && (await isFeatureEnabled("wishlist"))) {
    items.push({ labelKey: "wishlist", href: "/wishlist", authOnly: true });
  }
  if (await isFeatureEnabled("clientDashboard")) {
    items.push({ labelKey: "dashboard", href: "/dashboard", authOnly: true });
  }
  return items;
}
