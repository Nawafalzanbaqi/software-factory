import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Locale } from "@/lib/i18n/routing";
import { buildMetadata } from "@/lib/seo/metadata";
import { isFeatureEnabled } from "@/lib/config/options";
import { ordersApi, OrderTracking } from "@/features/orders";
import type { OrderTrackingDto } from "@/lib/api/types";

// Per-order status is fetched fresh (ordersApi uses cache: "no-store"); the route
// renders dynamically rather than being statically cached.
export const dynamic = "force-dynamic";

async function fetchTracking(orderNumber: string): Promise<OrderTrackingDto | null> {
  try {
    return await ordersApi.track(orderNumber);
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale; orderNumber: string }>;
}): Promise<Metadata> {
  const { locale, orderNumber } = await params;
  const t = await getTranslations({ locale, namespace: "orders" });
  // Order pages are user-specific — keep them out of the index.
  return buildMetadata({
    locale,
    title: `${t("trackingTitle")} · ${orderNumber}`,
    description: t("trackingSubtitle"),
    path: `/orders/${orderNumber}`,
    noIndex: true,
  });
}

export default async function OrderTrackingPage({
  params,
}: {
  params: Promise<{ locale: Locale; orderNumber: string }>;
}) {
  const { locale, orderNumber } = await params;
  setRequestLocale(locale);

  // Flag gate: order tracking is behind features.orderTracking (options.json).
  if (!(await isFeatureEnabled("orderTracking"))) notFound();

  const tracking = await fetchTracking(orderNumber);
  if (!tracking) notFound();

  return (
    <div className="container section-y">
      <OrderTracking tracking={tracking} />
    </div>
  );
}
