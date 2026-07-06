import type { Metadata } from "next";
import { setRequestLocale, getTranslations } from "next-intl/server";
import type { Locale } from "@/lib/i18n/routing";
import { buildMetadata } from "@/lib/seo/metadata";
import { PageHeader } from "@/components/ui/page-header";
import { getSiteConfig, getSiteType } from "@/lib/config/options";
import { CheckoutView, resolvePaymentMethods } from "@/features/checkout";
import { RestaurantCheckout } from "@/features/restaurant-checkout";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const siteType = await getSiteType();
  const namespace = siteType === "restaurant" ? "restaurantCheckout" : "checkout";
  const t = await getTranslations({ locale, namespace });
  // Checkout is user-specific — keep it out of the index.
  return buildMetadata({
    locale,
    title: t("title"),
    description: t("subtitle"),
    path: "/checkout",
    noIndex: true,
  });
}

export default async function CheckoutPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const { siteType, payments } = await getSiteConfig();

  // Restaurant vertical: food-order flow (dine-in / pickup / delivery). Reads the
  // shared client cart; fetches its own branch list. Payment method is config-driven.
  if (siteType === "restaurant") {
    const t = await getTranslations("restaurantCheckout");
    const paymentMethod = payments[0] ?? "cod";
    return (
      <div className="container section-y">
        {/* Same header treatment as the shared /cart page so the restaurant
            cart → checkout funnel doesn't switch design language mid-flow. */}
        <PageHeader title={t("title")} subtitle={t("subtitle")} className="mb-8" />
        <RestaurantCheckout paymentMethod={paymentMethod} />
      </div>
    );
  }

  // Ecommerce vertical: standard checkout. Payment methods are resolved on the
  // server (options.json `payments` + cod fallback) and passed to the client form.
  const t = await getTranslations("checkout");
  const paymentMethods = resolvePaymentMethods(payments);

  return (
    <div className="container section-y">
      <PageHeader title={t("title")} subtitle={t("subtitle")} className="mb-8" />
      <CheckoutView paymentMethods={paymentMethods} />
    </div>
  );
}
