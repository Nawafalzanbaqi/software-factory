import { getLocale, getTranslations } from "next-intl/server";
import { getDirection, type Locale } from "@/lib/i18n/routing";
import { promoBannersApi } from "../api/promoBannersApi";
import { toPromoBannerView } from "../types";
import { PromoBannersCarousel } from "./PromoBannersCarousel";

/**
 * Homepage "promoBanners" section (Server Component). Copy + media are CMS-driven
 * (Payload `promoBanners`); the heading falls back to i18n messages. Fetches on the
 * server, flattens each banner to the active locale, then hands a small serializable
 * payload to the client carousel leaf.
 *
 * Graceful empty state: the CMS stub returns `[]` until Payload is wired up, so the
 * section renders nothing rather than an empty shell (mirrors the hero/featured
 * sections). Section enable/order is handled upstream by getEnabledSections().
 */
export async function PromoBannersSection() {
  const locale = (await getLocale()) as Locale;
  const t = await getTranslations("promoBanners");
  const banners = await promoBannersApi.list();
  const views = banners.map((banner) => toPromoBannerView(banner, locale));

  if (views.length === 0) return null;

  const subtitle = t.has("subtitle") ? t("subtitle") : undefined;

  return (
    <section aria-labelledby="promo-banners-heading" className="container section-y">
      <div className="mb-8">
        <div aria-hidden="true" className="kicker mb-4" />
        <h2
          id="promo-banners-heading"
          className="font-display text-2xl font-semibold sm:text-3xl"
        >
          {t("title")}
        </h2>
        {subtitle && (
          <p className="mt-2 max-w-2xl text-muted-foreground">{subtitle}</p>
        )}
      </div>
      <PromoBannersCarousel banners={views} direction={getDirection(locale)} />
    </section>
  );
}
