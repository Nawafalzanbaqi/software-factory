import type { Metadata } from "next";
import { locales, type Locale } from "@/lib/i18n/routing";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export interface BuildMetadataInput {
  locale: Locale;
  title: string;
  description: string;
  /** Path WITHOUT locale prefix, e.g. "/products/foo" or "/". */
  path?: string;
  images?: string[];
  /** OpenGraph type; defaults to "website". */
  type?: "website" | "article" | "product";
  noIndex?: boolean;
}

/**
 * Build Next.js Metadata with canonical URL, hreflang alternates for every locale,
 * and OpenGraph/Twitter cards. localePrefix is "as-needed": the default locale (ar)
 * has no prefix, others (en) are prefixed — mirrored here for correct canonicals.
 */
export function buildMetadata({
  locale,
  title,
  description,
  path = "/",
  images,
  type = "website",
  noIndex = false,
}: BuildMetadataInput): Metadata {
  const normalizedPath = path === "/" ? "" : path.startsWith("/") ? path : `/${path}`;

  const hrefFor = (loc: Locale) =>
    loc === "ar"
      ? `${SITE_URL}${normalizedPath || "/"}`
      : `${SITE_URL}/${loc}${normalizedPath}`;

  const canonical = hrefFor(locale);

  const languages: Record<string, string> = {};
  for (const loc of locales) {
    languages[loc] = hrefFor(loc);
  }
  languages["x-default"] = hrefFor("ar");

  const ogImages = (images ?? []).map((url) => ({ url }));

  return {
    metadataBase: new URL(SITE_URL),
    title,
    description,
    alternates: {
      canonical,
      languages,
    },
    robots: noIndex ? { index: false, follow: false } : { index: true, follow: true },
    openGraph: {
      type: type === "product" ? "website" : type,
      url: canonical,
      title,
      description,
      locale,
      siteName: "Software Factory Store",
      images: ogImages,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images,
    },
  };
}

export { SITE_URL };
