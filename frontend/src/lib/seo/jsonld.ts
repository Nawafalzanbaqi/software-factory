import type { ProductDto } from "@/lib/api/types";
import type { Locale } from "@/lib/i18n/routing";
import { SITE_URL } from "./metadata";

/** JSON-LD builders. Render output via <script type="application/ld+json">. */

export function buildOrganizationJsonLd(input: {
  name: string;
  url?: string;
  logo?: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: input.name,
    url: input.url ?? SITE_URL,
    ...(input.logo ? { logo: input.logo } : {}),
  } as const;
}

export function buildProductJsonLd(product: ProductDto, locale: Locale) {
  const name = locale === "ar" ? product.nameAr : product.nameEn;
  const description = locale === "ar" ? product.descriptionAr : product.descriptionEn;
  const url =
    locale === "ar"
      ? `${SITE_URL}/products/${product.slug}`
      : `${SITE_URL}/${locale}/products/${product.slug}`;

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name,
    description,
    sku: product.id,
    image: product.images,
    // schema.org requires a rating count for a valid AggregateRating — omit the
    // whole block unless we have both a value and a count (else Google drops it
    // and may flag a Search Console error).
    ...(product.rating && product.ratingCount
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: product.rating,
            reviewCount: product.ratingCount,
            bestRating: 5,
            worstRating: 1,
          },
        }
      : {}),
    offers: {
      "@type": "Offer",
      url,
      price: product.price,
      priceCurrency: product.currency,
      availability: product.inStock
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
    },
  } as const;
}
