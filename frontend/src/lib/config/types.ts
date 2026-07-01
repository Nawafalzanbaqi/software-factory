/**
 * Types derived from options.schema.json (kept in sync manually; the schema is the
 * source of truth). These drive nav, routing and homepage section rendering.
 */

export type SiteType =
  | "ecommerce"
  | "corporate"
  | "portfolio"
  | "booking"
  | "lms"
  | "realestate"
  | "restaurant"
  | "healthcare"
  | "marketplace";

export type Language = "ar" | "en" | "ar-en";
export type Direction = "rtl" | "ltr";
export type PaymentProvider = "tamara" | "tabi" | "stripe" | "cod" | "mada";
export type Integration = "zatca" | "whatsapp" | "googleAnalytics" | "meta";
export type DesignDirection = "premium" | "minimal" | "playful" | "corporate";

/** Feature flags — keys mirror ARCHITECTURE.md §0 feature → flag mapping. */
export interface FeatureFlags {
  clientDashboard?: boolean;
  cms?: boolean;
  reviews?: boolean;
  loyalty?: boolean;
  analytics?: boolean;
  wishlist?: boolean;
  search?: boolean;
  orderTracking?: boolean;
  [key: string]: boolean | undefined;
}

export interface SectionConfig {
  enabled: boolean;
  order: number;
}

/** Homepage/section keys as used in options.json `sections`. */
export type SectionName =
  | "hero"
  | "promoBanners"
  | "categories"
  | "productListing"
  | "reviews"
  | "about"
  | "faq"
  | "contact"
  | "footer";

export type SectionsConfig = Partial<Record<SectionName, SectionConfig>> &
  Record<string, SectionConfig>;

export interface OptionsManifest {
  siteType: SiteType;
  siteName?: string;
  language: Language;
  defaultLocale?: "ar" | "en";
  defaultDirection: Direction;
  currency?: string;
  payments?: PaymentProvider[];
  integrations?: Integration[];
  features: FeatureFlags;
  sections: SectionsConfig;
  designDirection?: DesignDirection;
}

export type FeatureName = keyof FeatureFlags;

/** A resolved, ordered section ready for homepage rendering. */
export interface EnabledSection {
  name: SectionName;
  order: number;
}

/** Public, non-flag site config exposed to layout/metadata. */
export interface SiteConfig {
  siteName: string;
  siteType: SiteType;
  currency: string;
  defaultLocale: "ar" | "en";
  defaultDirection: Direction;
  designDirection: DesignDirection;
  payments: PaymentProvider[];
  integrations: Integration[];
}
