/**
 * CMS content shapes (Payload). These mirror the Payload collections/globals in
 * ARCHITECTURE.md §1. A dedicated Payload agent will implement the real fetchers;
 * features import ONLY from lib/cms so swapping the stub for live Payload queries
 * is a single-module change. All copy is bilingual (localized by Payload).
 */

export interface LocalizedText {
  ar: string;
  en: string;
}

export interface CmsMedia {
  url: string;
  alt: LocalizedText;
  width?: number;
  height?: number;
}

export interface HeroContent {
  eyebrow?: LocalizedText;
  title: LocalizedText;
  subtitle: LocalizedText;
  ctaPrimaryLabel?: LocalizedText;
  ctaPrimaryHref?: string;
  ctaSecondaryLabel?: LocalizedText;
  ctaSecondaryHref?: string;
  image?: CmsMedia;
}

export interface PromoBanner {
  id: string;
  title: LocalizedText;
  href?: string;
  image?: CmsMedia;
}

export interface FaqItem {
  id: string;
  question: LocalizedText;
  answer: LocalizedText;
}

export interface AboutContent {
  title: LocalizedText;
  body: LocalizedText;
  image?: CmsMedia;
}

export interface FooterColumn {
  title: LocalizedText;
  links: { label: LocalizedText; href: string }[];
}

export interface FooterContent {
  tagline?: LocalizedText;
  columns: FooterColumn[];
}

/**
 * Locale selector for the restaurant fetchers. "all" (default) returns bilingual
 * LocalizedText ({ en, ar }); "en"/"ar" narrows the Payload query to one locale
 * (both LocalizedText members are then filled with that locale's value).
 */
export type CmsLocale = "en" | "ar" | "all";

/* ----------------------------- Restaurant vertical ----------------------------- */

/** Mirrors MenuCategoryDto (CMS side). `itemCount` is derived by the backend. */
export interface MenuCategoryContent {
  id: string;
  slug: string;
  name: LocalizedText;
  description?: LocalizedText;
  image?: CmsMedia;
  order: number;
}

/** Mirrors MenuItemDto (CMS side). Canonical price/availability live in the backend. */
export interface MenuItemContent {
  id: string;
  slug: string;
  name: LocalizedText;
  description?: LocalizedText;
  price?: number;
  currency: string;
  categoryId?: string;
  images: CmsMedia[];
  isAvailable: boolean;
  tags: string[];
  spicyLevel?: number;
  calories?: number;
}

/** Aggregate returned by getMenu: categories + their items (grouped by categoryId). */
export interface MenuContent {
  categories: MenuCategoryContent[];
  items: MenuItemContent[];
}

/** A single weekly opening-hours row on a branch. */
export interface OpeningHour {
  day: string;
  opens?: string;
  closes?: string;
  closed?: boolean;
}

/** Mirrors BranchDto (CMS side). lat/lng feed the react-leaflet locator map. */
export interface BranchContent {
  id: string;
  slug: string;
  name: LocalizedText;
  address?: LocalizedText;
  city?: string;
  latitude?: number;
  longitude?: number;
  phone?: string;
  openingHours: OpeningHour[];
}

/** CMS-driven gallery block (title + ordered images). */
export interface GalleryContent {
  id: string;
  title: LocalizedText;
  images: CmsMedia[];
}

/** Promotion (mirrors PromoBanner; sourced from the `promotions` collection). */
export interface PromotionContent {
  id: string;
  title: LocalizedText;
  subtitle?: LocalizedText;
  ctaLabel?: LocalizedText;
  href?: string;
  image?: CmsMedia;
}
