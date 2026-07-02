import type { PromotionContent } from "@/lib/cms";
import type { Locale } from "@/lib/i18n/routing";

export type { PromotionContent };

/**
 * Own DTO for the promotions feature (PHASE2 §3 — features define their own types).
 *
 * Serializable, locale-resolved view of a CMS `PromotionContent`. The CMS shape
 * stores bilingual `LocalizedText`; we flatten to the active locale on the server
 * so the section stays a pure server render and no `server-only` CMS code needs to
 * cross a client boundary. Every optional field is only rendered when present, so
 * partially-filled CMS entries degrade gracefully.
 */
export interface PromotionView {
  id: string;
  /** Headline copy (CMS `title`) resolved to the active locale. */
  title: string;
  /** Supporting subcopy (CMS `subtitle`) resolved to the active locale. */
  subtitle?: string;
  /** CTA label; falls back to an i18n default in the card when absent. */
  ctaLabel?: string;
  /** Locale-aware destination for the CTA; CTA only renders when present. */
  href?: string;
  image?: {
    url: string;
    alt: string;
    width?: number;
    height?: number;
  };
  /**
   * ISO date the offer is valid until, rendered as a localized date when present.
   * lib/cms `PromotionContent` does not surface this yet; read forward-compatibly so
   * it flows through automatically once the Payload `promotions` collection adds it.
   * TODO(phase-3): expose `validUntil` on the shared CMS PromotionContent type.
   */
  validUntil?: string;
}

/**
 * Map a bilingual CMS promotion to the flattened view for the current locale.
 * `getPromotions()` returns `LocalizedText`, so localization happens here.
 */
export function toPromotionView(
  promotion: PromotionContent,
  locale: Locale,
): PromotionView {
  const validUntil = (promotion as { validUntil?: string }).validUntil;
  return {
    id: promotion.id,
    title: promotion.title[locale],
    subtitle: promotion.subtitle?.[locale] || undefined,
    ctaLabel: promotion.ctaLabel?.[locale] || undefined,
    href: promotion.href,
    image: promotion.image
      ? {
          url: promotion.image.url,
          alt: promotion.image.alt[locale] || promotion.title[locale],
          width: promotion.image.width,
          height: promotion.image.height,
        }
      : undefined,
    validUntil: validUntil || undefined,
  };
}
