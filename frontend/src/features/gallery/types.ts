import type { GalleryContent } from "@/lib/cms";
import type { Locale } from "@/lib/i18n/routing";

export type { GalleryContent };

/**
 * Serializable, locale-resolved view of a single CMS gallery image. The CMS shape
 * stores bilingual `LocalizedText` (alt) + a block `title`; we flatten to the
 * active locale on the server so the client Lightbox leaf receives a lean,
 * server-only-free payload.
 */
export interface GalleryImageView {
  /** Stable key (block id + index) for React lists / lightbox navigation. */
  key: string;
  url: string;
  /** Alt text resolved to the active locale (falls back to the block title). */
  alt: string;
  width?: number;
  height?: number;
}

/**
 * Flatten all enabled CMS gallery blocks into a single ordered list of localized
 * image views for the active locale. Blocks are already ordered by the fetcher;
 * we preserve that order and drop nothing else.
 */
export function toGalleryImageViews(
  blocks: GalleryContent[],
  locale: Locale,
): GalleryImageView[] {
  const views: GalleryImageView[] = [];
  for (const block of blocks) {
    const title = block.title[locale];
    block.images.forEach((image, index) => {
      views.push({
        key: `${block.id}-${index}`,
        url: image.url,
        alt: image.alt[locale] || title,
        width: image.width,
        height: image.height,
      });
    });
  }
  return views;
}
