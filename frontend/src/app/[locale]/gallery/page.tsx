import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { setRequestLocale, getTranslations } from "next-intl/server";
import type { Locale } from "@/lib/i18n/routing";
import { buildMetadata } from "@/lib/seo/metadata";
import { buildRestaurantJsonLd } from "@/lib/seo/jsonld";
import { JsonLd } from "@/lib/seo/json-ld";
import { getSiteConfig, getSiteType, isFeatureEnabled } from "@/lib/config/options";
import { GalleryPageContent } from "@/features/gallery";

// CMS-driven content; revalidate periodically so gallery edits propagate (ISR).
export const revalidate = 600;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "gallery" });
  return buildMetadata({
    locale,
    title: t("metaTitle"),
    description: t("metaDescription"),
    path: "/gallery",
  });
}

export default async function GalleryPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  // Vertical + feature gating (PHASE2.md §5, HARD RULE 6): restaurant-only route.
  const [siteType, enabled] = await Promise.all([
    getSiteType(),
    isFeatureEnabled("gallery"),
  ]);
  if (siteType !== "restaurant" || !enabled) notFound();

  const site = await getSiteConfig();

  return (
    <>
      <JsonLd
        data={buildRestaurantJsonLd({
          name: site.siteName,
          menuUrl: "/menu",
        })}
      />
      <GalleryPageContent />
    </>
  );
}
