import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/lib/i18n/navigation";
import { isFeatureEnabled, isSectionEnabled } from "@/lib/config/options";
import type { Locale } from "@/lib/i18n/routing";
import { promotionsApi } from "../api/promotionsApi";
import { toPromotionView } from "../types";
import { PromotionsGrid } from "./PromotionsGrid";

/**
 * Homepage "promotions" section (Server Component, restaurant vertical).
 * CMS-driven (Payload `promotions` via lib/cms getPromotions) — no backend.
 *
 * Gating: returns null when the `promotions` section OR feature flag is disabled,
 * and when the CMS yields no offers (graceful — renders nothing rather than an
 * empty shell). Section enable/order is also honored upstream by getEnabledSections.
 */
export async function PromotionsSection() {
  const [sectionOn, featureOn] = await Promise.all([
    isSectionEnabled("promotions"),
    isFeatureEnabled("promotions"),
  ]);
  if (!sectionOn || !featureOn) return null;

  const locale = (await getLocale()) as Locale;
  const t = await getTranslations("promotions");
  const promotions = (await promotionsApi.list(locale)).map((p) =>
    toPromotionView(p, locale),
  );

  // No offers → render nothing (mirrors hero/promo-banners sections).
  if (promotions.length === 0) return null;

  const subtitle = t.has("subtitle") ? t("subtitle") : undefined;

  return (
    <section
      aria-labelledby="promotions-heading"
      aria-label={t("regionLabel")}
      className="container section-y"
    >
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2
            id="promotions-heading"
            className="font-display text-2xl font-semibold"
          >
            {t("title")}
          </h2>
          {subtitle && (
            <p className="mt-2 max-w-2xl text-muted-foreground">{subtitle}</p>
          )}
        </div>
        <Link
          href="/promotions"
          className="rounded text-sm font-medium text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          {t("viewAll")}
        </Link>
      </div>
      <PromotionsGrid promotions={promotions} locale={locale} />
    </section>
  );
}
