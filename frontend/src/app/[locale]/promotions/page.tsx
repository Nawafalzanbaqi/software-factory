import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { setRequestLocale, getTranslations } from "next-intl/server";
import type { Locale } from "@/lib/i18n/routing";
import { buildMetadata } from "@/lib/seo/metadata";
import { buildRestaurantJsonLd } from "@/lib/seo/jsonld";
import { JsonLd } from "@/lib/seo/json-ld";
import { getSiteType, isFeatureEnabled, getSiteConfig } from "@/lib/config/options";
import { promotionsApi, toPromotionView, PromotionsGrid } from "@/features/promotions";

// CMS-driven; ISR keeps the page fresh without a per-request DB hit.
export const revalidate = 300;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "promotions" });
  return buildMetadata({
    locale,
    title: t("pageTitle"),
    description: t("pageSubtitle"),
    path: "/promotions",
  });
}

/**
 * Restaurant-only /promotions page listing every active CMS promotion.
 * Vertical gating (PHASE2 §5): 404 when not the restaurant vertical or when the
 * `promotions` feature flag is off.
 */
export default async function PromotionsPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const [siteType, featureOn] = await Promise.all([
    getSiteType(),
    isFeatureEnabled("promotions"),
  ]);
  if (siteType !== "restaurant" || !featureOn) notFound();

  const t = await getTranslations("promotions");
  const [config, docs] = await Promise.all([
    getSiteConfig(),
    promotionsApi.list(locale),
  ]);
  const promotions = docs.map((p) => toPromotionView(p, locale));

  const jsonLd = buildRestaurantJsonLd({
    name: config.siteName,
    priceRange: "$$",
  });

  return (
    <div className="container section-y">
      <JsonLd data={jsonLd} />
      <header className="mb-8">
        <h1 className="font-display text-3xl font-semibold">{t("pageTitle")}</h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          {t("pageSubtitle")}
        </p>
      </header>
      <PromotionsGrid promotions={promotions} locale={locale} />
    </div>
  );
}
