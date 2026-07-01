import type { MetadataRoute } from "next";
import { locales } from "@/lib/i18n/routing";
import { productsApi } from "@/features/products";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

/** Build a localized URL honoring the "as-needed" prefix (ar has no prefix). */
function localizedUrl(locale: string, path: string) {
  const p = path === "/" ? "" : path;
  return locale === "ar" ? `${SITE_URL}${p || "/"}` : `${SITE_URL}/${locale}${p}`;
}

/** Runtime sitemap (complements next-sitemap for dynamic product routes). */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPaths = ["/", "/products", "/categories", "/about", "/faq", "/contact"];

  const entries: MetadataRoute.Sitemap = [];

  for (const path of staticPaths) {
    entries.push({
      url: localizedUrl("ar", path),
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: path === "/" ? 1 : 0.7,
      alternates: {
        languages: Object.fromEntries(
          locales.map((l) => [l, localizedUrl(l, path)]),
        ),
      },
    });
  }

  // Dynamic product detail pages.
  let slugs: string[] = [];
  try {
    slugs = await productsApi.allSlugs();
  } catch {
    slugs = [];
  }
  for (const slug of slugs) {
    const path = `/products/${slug}`;
    entries.push({
      url: localizedUrl("ar", path),
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.6,
      alternates: {
        languages: Object.fromEntries(
          locales.map((l) => [l, localizedUrl(l, path)]),
        ),
      },
    });
  }

  return entries;
}
