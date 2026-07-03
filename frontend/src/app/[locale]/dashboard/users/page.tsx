import type { Metadata } from "next";
import { setRequestLocale, getTranslations } from "next-intl/server";
import type { Locale } from "@/lib/i18n/routing";
import { buildMetadata } from "@/lib/seo/metadata";
import { requireDashboardAccess } from "@/features/dashboard";
import { UsersManager } from "@/features/dashboard-users";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "dashboardUsers" });
  return buildMetadata({
    locale,
    title: t("title"),
    description: t("intro"),
    path: "/dashboard/users",
    noIndex: true,
  });
}

/** Users & roles (features.dashboardUsers) — OWNER ONLY: staff get 403. */
export default async function DashboardUsersPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const { session } = await requireDashboardAccess({
    locale,
    moduleFlags: ["dashboardUsers"],
    ownerOnly: true,
    returnTo: "/dashboard/users",
  });

  const t = await getTranslations("dashboardUsers");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold">{t("title")}</h1>
        <p className="mt-1 text-muted-foreground">{t("intro")}</p>
      </div>
      <UsersManager
        payloadToken={session.payloadToken ?? ""}
        currentUserId={session.user.id}
      />
    </div>
  );
}
