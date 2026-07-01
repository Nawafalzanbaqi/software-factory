import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { setRequestLocale, getTranslations } from "next-intl/server";
import type { Locale } from "@/lib/i18n/routing";
import { buildMetadata } from "@/lib/seo/metadata";
import { isFeatureEnabled } from "@/lib/config/options";
import { OrderLookupForm } from "@/features/orders";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "orders" });
  return buildMetadata({
    locale,
    title: t("lookupTitle"),
    description: t("lookupSubtitle"),
    path: "/orders",
  });
}

/**
 * Public order-lookup landing. Enter an order number to reach the
 * /orders/<number> tracking page. Gated by features.orderTracking (options.json)
 * — the feature's code still exists when the flag is off (feature-flag pattern).
 */
export default async function OrdersLookupPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  if (!(await isFeatureEnabled("orderTracking"))) notFound();

  const t = await getTranslations("orders");

  return (
    <div className="container section-y max-w-2xl">
      <h1 className="font-display text-2xl font-semibold">{t("lookupTitle")}</h1>
      <p className="mt-2 text-muted-foreground">{t("lookupSubtitle")}</p>
      <div className="mt-8">
        <OrderLookupForm />
      </div>
    </div>
  );
}
