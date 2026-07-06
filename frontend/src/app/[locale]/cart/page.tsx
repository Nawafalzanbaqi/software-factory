import type { Metadata } from "next";
import { setRequestLocale, getTranslations } from "next-intl/server";
import type { Locale } from "@/lib/i18n/routing";
import { buildMetadata } from "@/lib/seo/metadata";
import { PageHeader } from "@/components/ui/page-header";
import { getSiteType } from "@/lib/config/options";
import { CartView } from "@/features/cart";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "cart" });
  // Cart is user-specific — keep it out of the index.
  return buildMetadata({
    locale,
    title: t("title"),
    description: t("title"),
    path: "/cart",
    noIndex: true,
  });
}

export default async function CartPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("cart");
  // Empty-state CTA targets the active vertical's catalog (config-driven).
  const continueHref = (await getSiteType()) === "restaurant" ? "/menu" : "/products";

  return (
    <div className="container section-y">
      <PageHeader title={t("title")} className="mb-8" />
      <CartView continueHref={continueHref} />
    </div>
  );
}
