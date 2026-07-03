import type { Metadata } from "next";
import { setRequestLocale, getTranslations } from "next-intl/server";
import type { Locale } from "@/lib/i18n/routing";
import { buildMetadata } from "@/lib/seo/metadata";
import { requireDashboardAccess } from "@/features/dashboard";
import { ContentLinksGrid } from "@/features/dashboard-content";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "dashboardContent" });
  return buildMetadata({
    locale,
    title: t("title"),
    description: t("intro"),
    path: "/dashboard/content",
    noIndex: true,
  });
}

/** Content module (features.dashboardContent + cms): Payload admin deep links. */
export default async function DashboardContentPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  await requireDashboardAccess({
    locale,
    moduleFlags: ["dashboardContent", "cms"],
    returnTo: "/dashboard/content",
  });

  const t = await getTranslations("dashboardContent");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold">{t("title")}</h1>
        <p className="mt-1 text-muted-foreground">{t("intro")}</p>
      </div>
      <ContentLinksGrid />
    </div>
  );
}
