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

/* ---------------------------------------------------------------------------
 * Restaurant vertical (Phase 2) JSON-LD builders.
 * Used on restaurant pages instead of Product/Organization. Inputs are plain
 * shapes (not backend DTOs) so this stays decoupled from the restaurant feature
 * modules that other agents ship — callers map their DTO -> these fields.
 * ------------------------------------------------------------------------- */

export interface PostalAddressInput {
  streetAddress?: string;
  addressLocality?: string;
  addressRegion?: string;
  postalCode?: string;
  /** ISO country code, e.g. "SA". */
  addressCountry?: string;
}

export interface GeoInput {
  latitude: number;
  longitude: number;
}

export interface LocalBusinessInput {
  name: string;
  url?: string;
  telephone?: string;
  image?: string | string[];
  priceRange?: string;
  address?: PostalAddressInput;
  geo?: GeoInput;
  /** schema.org OpeningHoursSpecification-style strings, e.g. "Mo-Su 12:00-23:00". */
  openingHours?: string[];
}

function buildPlaceJsonLd(type: string, input: LocalBusinessInput) {
  return {
    "@context": "https://schema.org",
    "@type": type,
    name: input.name,
    url: input.url ?? SITE_URL,
    ...(input.telephone ? { telephone: input.telephone } : {}),
    ...(input.image ? { image: input.image } : {}),
    ...(input.priceRange ? { priceRange: input.priceRange } : {}),
    ...(input.address
      ? {
          address: {
            "@type": "PostalAddress",
            ...(input.address.streetAddress
              ? { streetAddress: input.address.streetAddress }
              : {}),
            ...(input.address.addressLocality
              ? { addressLocality: input.address.addressLocality }
              : {}),
            ...(input.address.addressRegion
              ? { addressRegion: input.address.addressRegion }
              : {}),
            ...(input.address.postalCode
              ? { postalCode: input.address.postalCode }
              : {}),
            ...(input.address.addressCountry
              ? { addressCountry: input.address.addressCountry }
              : {}),
          },
        }
      : {}),
    ...(input.geo
      ? {
          geo: {
            "@type": "GeoCoordinates",
            latitude: input.geo.latitude,
            longitude: input.geo.longitude,
          },
        }
      : {}),
    ...(input.openingHours && input.openingHours.length > 0
      ? { openingHours: input.openingHours }
      : {}),
  } as const;
}

/** Generic LocalBusiness (e.g. a branch that isn't specifically a Restaurant). */
export function buildLocalBusinessJsonLd(input: LocalBusinessInput) {
  return buildPlaceJsonLd("LocalBusiness", input);
}

/**
 * schema.org Restaurant — used on restaurant home/branch pages. Extends
 * LocalBusiness with `servesCuisine` and an optional menu URL.
 */
export function buildRestaurantJsonLd(
  input: LocalBusinessInput & {
    servesCuisine?: string | string[];
    acceptsReservations?: boolean;
    menuUrl?: string;
  },
) {
  return {
    ...buildPlaceJsonLd("Restaurant", input),
    ...(input.servesCuisine ? { servesCuisine: input.servesCuisine } : {}),
    ...(input.acceptsReservations !== undefined
      ? { acceptsReservations: input.acceptsReservations }
      : {}),
    ...(input.menuUrl ? { menu: input.menuUrl } : {}),
  } as const;
}

/** schema.org MenuItem (with an Offer) — used on menu item detail pages. */
export function buildMenuItemJsonLd(input: {
  name: string;
  description?: string;
  image?: string | string[];
  price?: number;
  currency?: string;
  url?: string;
  /** e.g. ["vegetarian"], mapped to schema.org suitableForDiet where relevant. */
  menuSection?: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "MenuItem",
    name: input.name,
    ...(input.description ? { description: input.description } : {}),
    ...(input.image ? { image: input.image } : {}),
    ...(input.menuSection ? { menuAddOn: input.menuSection } : {}),
    ...(input.price !== undefined
      ? {
          offers: {
            "@type": "Offer",
            price: input.price,
            priceCurrency: input.currency ?? "SAR",
            ...(input.url ? { url: input.url } : {}),
          },
        }
      : {}),
  } as const;
}
