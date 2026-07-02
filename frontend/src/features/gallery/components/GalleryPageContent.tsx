import { getLocale, getTranslations } from "next-intl/server";
import type { Locale } from "@/lib/i18n/routing";
import { galleryApi } from "../api/galleryApi";
import { toGalleryImageViews } from "../types";
import { GalleryLightbox } from "./GalleryLightbox";

/**
 * /gallery page body (Server Component). Fetches CMS gallery blocks, flattens them
 * to locale-resolved image views on the server, and hands the serializable payload
 * to the client Lightbox leaf. Copy comes from the "gallery" messages namespace;
 * media/alt come from the CMS. Renders an accessible empty state when the CMS has
 * no images so the page never looks broken.
 */
export async function GalleryPageContent() {
  const locale = (await getLocale()) as Locale;
  const t = await getTranslations("gallery");
  const blocks = await galleryApi.list();
  const images = toGalleryImageViews(blocks, locale);

  const subtitle = t.has("subtitle") ? t("subtitle") : undefined;

  return (
    <div className="container section-y">
      <header className="mb-8 max-w-2xl">
        <h1 className="font-display text-3xl font-semibold sm:text-4xl">
          {t("title")}
        </h1>
        {subtitle && (
          <p className="mt-3 text-muted-foreground">{subtitle}</p>
        )}
      </header>

      {images.length > 0 ? (
        <GalleryLightbox images={images} />
      ) : (
        <p className="rounded-lg border border-dashed p-10 text-center text-muted-foreground">
          {t("empty")}
        </p>
      )}
    </div>
  );
}
