import type { PaginatedDocs } from "payload";
import type { MenuItem, Product } from "@/payload-types";

/**
 * Catalog management types. Doc shapes derive from the GENERATED Payload types
 * (src/payload-types.ts, `npm run generate:types`); the only local addition is
 * the `locale=all` view, where every `localized: true` field comes back as a
 * per-locale object instead of a string (a Payload runtime envelope that the
 * generated types intentionally don't model).
 */
export interface LocalizedValue {
  en?: string | null;
  ar?: string | null;
}

/** A localized:true text field under `locale=all` (or a plain string otherwise). */
export type MaybeLocalized = string | LocalizedValue | null | undefined;

/** The two catalog collections; the active one is picked by getSiteType(). */
export type CatalogCollectionSlug = "products" | "menuItems";

export interface CatalogCollectionConfig {
  slug: CatalogCollectionSlug;
  /** Availability checkbox differs per vertical (inStock vs isAvailable). */
  availabilityField: "inStock" | "isAvailable";
}

export const CATALOG_BY_SITE_TYPE: Record<"ecommerce" | "restaurant", CatalogCollectionConfig> = {
  ecommerce: { slug: "products", availabilityField: "inStock" },
  restaurant: { slug: "menuItems", availabilityField: "isAvailable" },
};

/** Generated doc types, with localized text widened for the locale=all view. */
export type CatalogDoc = Omit<Product | MenuItem, "name" | "description"> & {
  name?: MaybeLocalized;
  description?: MaybeLocalized;
  inStock?: boolean | null;
  isAvailable?: boolean | null;
};

/** Payload REST list envelope (shared type from the payload package). */
export type CatalogListResponse = PaginatedDocs<CatalogDoc>;

/** Pick one locale out of a maybe-localized field. */
export function localizedText(value: MaybeLocalized, locale: "en" | "ar"): string {
  if (value && typeof value === "object") return value[locale] ?? "";
  return typeof value === "string" ? value : "";
}
