import Image from "next/image";
import { getLocale, getTranslations } from "next-intl/server";
import { ArrowRight } from "lucide-react";
import { Link } from "@/lib/i18n/navigation";
import { Button } from "@/components/ui/button";
import { getSiteType, isSectionEnabled } from "@/lib/config/options";
import type { Locale } from "@/lib/i18n/routing";
import { galleryApi } from "../api/galleryApi";
import { toGalleryImageViews } from "../types";

/** How many images the homepage teaser shows before "view all". */
const HOME_PREVIEW_COUNT = 8;

/**
 * Homepage "gallery" section (Server Component, sectionKey "gallery"). Images are
 * CMS-driven (Payload `gallery` via lib/cms `getGallery`); the heading falls back
 * to i18n messages. Renders a responsive next/image grid (AVIF/WebP handled by
 * next/image) and links to the full /gallery page.
 *
 * Gating (HARD RULE 6): self-gates to the restaurant vertical + the `gallery`
 * section flag, and returns null when disabled OR when the CMS has no images, so
 * the homepage never shows an empty shell. No lightbox here (that lives on the
 * page) — this stays a pure Server Component with no client JS.
 */
export async function GallerySection() {
  const [siteType, enabled] = await Promise.all([
    getSiteType(),
    isSectionEnabled("gallery"),
  ]);
  if (siteType !== "restaurant" || !enabled) return null;

  const locale = (await getLocale()) as Locale;
  const t = await getTranslations("gallery");
  const blocks = await galleryApi.list();
  const images = toGalleryImageViews(blocks, locale);

  if (images.length === 0) return null;

  const preview = images.slice(0, HOME_PREVIEW_COUNT);
  const subtitle = t.has("subtitle") ? t("subtitle") : undefined;

  return (
    <section aria-labelledby="gallery-heading" className="container section-y">
      <div className="mb-6">
        <h2 id="gallery-heading" className="font-display text-2xl font-semibold">
          {t("title")}
        </h2>
        {subtitle && (
          <p className="mt-2 max-w-2xl text-muted-foreground">{subtitle}</p>
        )}
      </div>

      <ul
        className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:gap-4 lg:grid-cols-4"
        role="list"
      >
        {preview.map((image) => (
          <li
            key={image.key}
            className="relative aspect-square overflow-hidden rounded-lg border bg-muted"
          >
            <Image
              src={image.url}
              alt={image.alt}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              className="object-cover transition-transform duration-300 hover:scale-105"
              // Below the fold on the homepage — lazy-load.
              loading="lazy"
            />
          </li>
        ))}
      </ul>

      <div className="mt-8">
        <Button asChild variant="outline">
          <Link href="/gallery">
            {t("viewAll")}
            <ArrowRight className="size-4 rtl:rotate-180" aria-hidden="true" />
          </Link>
        </Button>
      </div>
    </section>
  );
}
