import type { Metadata } from "next";
import { setRequestLocale, getTranslations } from "next-intl/server";
import type { Locale } from "@/lib/i18n/routing";
import { buildMetadata } from "@/lib/seo/metadata";
import { requireDashboardAccess } from "@/features/dashboard";
import { SettingsForm } from "@/features/dashboard-settings";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "dashboardSettings" });
  return buildMetadata({
    locale,
    title: t("title"),
    description: t("intro"),
    path: "/dashboard/settings",
    noIndex: true,
  });
}

/**
 * Settings module (features.dashboardSettings): the siteSettings global.
 * OWNER ONLY (audit fix #4) — staff get 403, matching the Payload-side
 * canEditSettings rule.
 */
export default async function DashboardSettingsPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const { session } = await requireDashboardAccess({
    locale,
    moduleFlags: ["dashboardSettings"],
    ownerOnly: true,
    returnTo: "/dashboard/settings",
  });

  const t = await getTranslations("dashboardSettings");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold">{t("title")}</h1>
        <p className="mt-1 text-muted-foreground">{t("intro")}</p>
      </div>
      <SettingsForm payloadToken={session.payloadToken ?? ""} />
    </div>
  );
}
