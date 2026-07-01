import type { Metadata } from "next";
import { setRequestLocale, getTranslations } from "next-intl/server";
import type { Locale } from "@/lib/i18n/routing";
import { buildMetadata } from "@/lib/seo/metadata";
import { getSiteConfig } from "@/lib/config/options";
import { CheckoutView, resolvePaymentMethods } from "@/features/checkout";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "checkout" });
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
  const t = await getTranslations("checkout");

  // Payment methods are config-driven (options.json `payments` + cod fallback),
  // resolved on the server and passed to the client form leaf.
  const { payments } = await getSiteConfig();
  const paymentMethods = resolvePaymentMethods(payments);

  return (
    <div className="container section-y">
      <h1 className="mb-8 font-display text-2xl font-semibold">{t("title")}</h1>
      <CheckoutView paymentMethods={paymentMethods} />
    </div>
  );
}
