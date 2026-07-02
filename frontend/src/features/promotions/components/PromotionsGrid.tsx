import { getTranslations } from "next-intl/server";
import type { Locale } from "@/lib/i18n/routing";
import type { PromotionView } from "../types";
import { PromotionCard } from "./PromotionCard";

/**
 * Responsive offer-card grid (Server Component). Renders a graceful empty state
 * when there are no active promotions. Shared by the homepage section and the
 * /promotions page so both stay visually consistent.
 */
export async function PromotionsGrid({
  promotions,
  locale,
}: {
  promotions: PromotionView[];
  locale: Locale;
}) {
  const t = await getTranslations("promotions");

  if (promotions.length === 0) {
    return (
      <p className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
        {t("empty")}
      </p>
    );
  }

  return (
    <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {promotions.map((promotion) => (
        <PromotionCard key={promotion.id} promotion={promotion} locale={locale} />
      ))}
    </ul>
  );
}
