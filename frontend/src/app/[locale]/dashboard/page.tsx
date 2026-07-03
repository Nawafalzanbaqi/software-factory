import type { Metadata } from "next";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { Package, ShoppingBag, PenSquare, Users, Settings } from "lucide-react";
import type { Locale } from "@/lib/i18n/routing";
import { Link } from "@/lib/i18n/navigation";
import { buildMetadata } from "@/lib/seo/metadata";
import { isFeatureEnabled } from "@/lib/config/options";
import { requireDashboardAccess, getDashboardNav } from "@/features/dashboard";
import { AnalyticsWidget } from "@/features/dashboard-analytics";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "dashboard" });
  return buildMetadata({
    locale,
    title: t("title"),
    description: t("overview.intro"),
    path: "/dashboard",
    noIndex: true,
  });
}

const MODULE_ICONS = {
  orders: Package,
  catalog: ShoppingBag,
  content: PenSquare,
  users: Users,
  settings: Settings,
} as const;

/**
 * Overview (Phase 4): the client's home — options+role-driven module cards
 * plus the analytics widget (features.analytics). Replaces the Phase 1 stub.
 */
export default async function DashboardOverviewPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const { session, role } = await requireDashboardAccess({ locale });
  const t = await getTranslations("dashboard");

  const name = session.user.name ?? session.user.email ?? "";
  const modules = (await getDashboardNav(role)).filter((item) => item.labelKey !== "overview");
  const analyticsOn = await isFeatureEnabled("analytics");

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl font-semibold">{t("welcome", { name })}</h1>
        <p className="mt-1 text-muted-foreground">{t("overview.intro")}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {modules.map((item) => {
          const Icon = MODULE_ICONS[item.labelKey as keyof typeof MODULE_ICONS] ?? Package;
          return (
            <Link key={item.href} href={item.href} className="group focus-visible:outline-none">
              <Card className="h-full transition-colors group-hover:border-accent group-focus-visible:border-accent">
                <CardHeader>
                  <Icon className="size-6 text-accent" aria-hidden="true" />
                  <CardTitle className="mt-2 text-lg">{t(`nav.${item.labelKey}`)}</CardTitle>
                  <CardDescription>{t(`overview.${item.labelKey}Card`)}</CardDescription>
                </CardHeader>
              </Card>
            </Link>
          );
        })}
      </div>

      {analyticsOn && <AnalyticsWidget />}
    </div>
  );
}
