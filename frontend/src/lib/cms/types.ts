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
