import type { MetadataRoute } from "next";
import { locales } from "@/lib/i18n/routing";
import { getSiteType } from "@/lib/config/options";
import { productsApi } from "@/features/products";
import { menuApi } from "@/features/menu";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

/** Build a localized URL honoring the "as-needed" prefix (ar has no prefix). */
function localizedUrl(locale: string, path: string) {
  const p = path === "/" ? "" : path;
  return locale === "ar" ? `${SITE_URL}${p || "/"}` : `${SITE_URL}/${locale}${p}`;
}

function entry(
  path: string,
  changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"],
  priority: number,
): MetadataRoute.Sitemap[number] {
  return {
    url: localizedUrl("ar", path),
    lastModified: new Date(),
    changeFrequency,
    priority,
    alternates: {
      languages: Object.fromEntries(locales.map((l) => [l, localizedUrl(l, path)])),
    },
  };
}

/**
 * Runtime sitemap — VERTICAL-AWARE (config-driven): emits only the active
 * vertical's routes so the wrong vertical's (404-guarded) pages never leak into
 * the index. Complements next-sitemap for dynamic detail routes.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteType = await getSiteType();
  const entries: MetadataRoute.Sitemap = [];

  if (siteType === "restaurant") {
    const staticPaths = [
      "/",
      "/menu",
      "/branches",
      "/reservations",
      "/gallery",
      "/promotions",
      "/about",
      "/faq",
      "/contact",
    ];
    for (const path of staticPaths) {
      entries.push(entry(path, "daily", path === "/" ? 1 : 0.7));
    }
    // Dynamic menu item detail pages.
    let slugs: string[] = [];
    try {
      slugs = await menuApi.allSlugs();
    } catch {
      slugs = [];
    }
    for (const slug of slugs) {
      entries.push(entry(`/menu/${slug}`, "weekly", 0.6));
    }
    return entries;
  }

  // Default: ecommerce.
  const staticPaths = ["/", "/products", "/categories", "/about", "/faq", "/contact"];
  for (const path of staticPaths) {
    entries.push(entry(path, "daily", path === "/" ? 1 : 0.7));
  }
  // Dynamic product detail pages.
  let slugs: string[] = [];
  try {
    slugs = await productsApi.allSlugs();
  } catch {
    slugs = [];
  }
  for (const slug of slugs) {
    entries.push(entry(`/products/${slug}`, "weekly", 0.6));
  }
  return entries;
}
