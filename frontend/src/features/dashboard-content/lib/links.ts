import "server-only";
import { getSiteType, isFeatureEnabled, isSectionEnabled } from "@/lib/config/options";

/**
 * Deep links into the Payload admin for every section the active build can
 * edit — options-driven like the rest of the factory: a disabled section or
 * feature contributes no link. Slugs mirror src/payload/{collections,globals}.
 */
export interface ContentLink {
  /** i18n key under `dashboardContent.links.*`. */
  labelKey: string;
  /** Path inside the Payload admin (unlocalized — /admin owns its own UI). */
  href: string;
}

export async function getContentLinks(): Promise<ContentLink[]> {
  const siteType = await getSiteType();
  const links: ContentLink[] = [];

  if (await isSectionEnabled("hero")) {
    links.push({ labelKey: "hero", href: "/admin/globals/hero" });
  }

  if (siteType === "restaurant") {
    if (await isSectionEnabled("menu")) {
      links.push({ labelKey: "menuItems", href: "/admin/collections/menuItems" });
      links.push({ labelKey: "menuCategories", href: "/admin/collections/menuCategories" });
    }
    if (await isSectionEnabled("promotions")) {
      links.push({ labelKey: "promotions", href: "/admin/collections/promotions" });
    }
    if (await isSectionEnabled("gallery")) {
      links.push({ labelKey: "gallery", href: "/admin/collections/gallery" });
    }
    if (await isSectionEnabled("branches")) {
      links.push({ labelKey: "branches", href: "/admin/collections/branches" });
    }
    if (await isFeatureEnabled("reservations")) {
      links.push({ labelKey: "reservations", href: "/admin/collections/reservations" });
    }
  } else {
    if (await isSectionEnabled("productListing")) {
      links.push({ labelKey: "products", href: "/admin/collections/products" });
    }
    if (await isSectionEnabled("categories")) {
      links.push({ labelKey: "categories", href: "/admin/collections/categories" });
    }
    if (await isSectionEnabled("promoBanners")) {
      links.push({ labelKey: "promoBanners", href: "/admin/collections/promoBanners" });
    }
  }

  if (await isFeatureEnabled("reviews")) {
    links.push({ labelKey: "reviews", href: "/admin/collections/reviews" });
  }
  if (await isSectionEnabled("about")) {
    links.push({ labelKey: "about", href: "/admin/globals/about" });
  }
  if (await isSectionEnabled("faq")) {
    links.push({ labelKey: "faq", href: "/admin/collections/faq" });
  }
  if (await isSectionEnabled("contact")) {
    links.push({ labelKey: "contact", href: "/admin/globals/contact" });
  }
  if (await isSectionEnabled("footer")) {
    links.push({ labelKey: "footer", href: "/admin/globals/footer" });
  }

  links.push({ labelKey: "media", href: "/admin/collections/media" });

  return links;
}
