import type { PromoBanner } from "@/lib/cms";
import type { Locale } from "@/lib/i18n/routing";

export type { PromoBanner };

/**
 * Serializable, locale-resolved view of a CMS `PromoBanner` that can be handed to
 * the client carousel leaf. The CMS shape stores bilingual `LocalizedText`; we
 * flatten to the active locale on the server so the client bundle stays lean and
 * no `server-only` CMS code crosses the client boundary.
 */
export interface PromoBannerView {
  id: string;
  /** Headline copy (CMS `title`) already resolved to the active locale. */
  headline: string;
  /** Locale-aware destination; CTA is only rendered when present. */
  href?: string;
  image?: {
    url: string;
    alt: string;
    width?: number;
    height?: number;
  };
}

/**
 * Map a bilingual CMS banner to the flattened view for the current locale.
 * `getPromoBanners()` returns `LocalizedText`, so localization happens here rather
 * than in the fetcher (which is locale-agnostic in the CMS stub).
 *
 * TODO (backlog): surface CMS `subcopy` + per-banner CTA label once the
 * `promoBanners` Payload collection exposes them (lib/cms PromoBanner is shared).
 */
export function toPromoBannerView(
  banner: PromoBanner,
  locale: Locale,
): PromoBannerView {
  return {
    id: banner.id,
    headline: banner.title[locale],
    href: banner.href,
    image: banner.image
      ? {
          url: banner.image.url,
          alt: banner.image.alt[locale] || banner.title[locale],
          width: banner.image.width,
          height: banner.image.height,
        }
      : undefined,
  };
}
