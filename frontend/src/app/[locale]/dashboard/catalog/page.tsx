import type { Metadata } from "next";
import { setRequestLocale, getTranslations } from "next-intl/server";
import type { Locale } from "@/lib/i18n/routing";
import { buildMetadata } from "@/lib/seo/metadata";
import { getSiteConfig, getSiteType } from "@/lib/config/options";
import { requireDashboardAccess } from "@/features/dashboard";
import { CatalogManager, CATALOG_BY_SITE_TYPE } from "@/features/dashboard-catalog";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "dashboardCatalog" });
  const siteType = await getSiteType();
  const restaurant = siteType === "restaurant";
  return buildMetadata({
    locale,
    title: restaurant ? t("titleMenu") : t("titleProducts"),
    description: restaurant ? t("introMenu") : t("introProducts"),
    path: "/dashboard/catalog",
    noIndex: true,
  });
}

/**
 * Catalog management (features.dashboardCatalog) — vertical-aware: the
 * collection (products vs menuItems) is picked by getSiteType() and edited
 * through Payload REST with the session's Payload JWT.
 */
export default async function DashboardCatalogPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const { session } = await requireDashboardAccess({
    locale,
    moduleFlags: ["dashboardCatalog"],
    returnTo: "/dashboard/catalog",
  });

  const t = await getTranslations("dashboardCatalog");
  const siteType = await getSiteType();
  const restaurant = siteType === "restaurant";
  const collection = CATALOG_BY_SITE_TYPE[restaurant ? "restaurant" : "ecommerce"];
  const { currency } = await getSiteConfig();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold">
          {restaurant ? t("titleMenu") : t("titleProducts")}
        </h1>
        <p className="mt-1 text-muted-foreground">
          {restaurant ? t("introMenu") : t("introProducts")}
        </p>
      </div>
      <CatalogManager
        collection={collection}
        currency={currency}
        payloadToken={session.payloadToken ?? ""}
      />
    </div>
  );
}
