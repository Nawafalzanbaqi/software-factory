import type { Metadata } from "next";
import { setRequestLocale, getTranslations } from "next-intl/server";
import type { Locale } from "@/lib/i18n/routing";
import { buildMetadata } from "@/lib/seo/metadata";
import { getAccessToken } from "@/lib/auth";
import { requireDashboardAccess } from "@/features/dashboard";
import { ManagedOrdersTable, manageOrdersApi, MANAGED_ORDER_STATUSES } from "@/features/dashboard-orders";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "dashboardOrders" });
  return buildMetadata({
    locale,
    title: t("title"),
    description: t("intro"),
    path: "/dashboard/orders",
    noIndex: true,
  });
}

/** Store-wide order management (features.dashboardOrders). */
export default async function DashboardOrdersPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: Locale }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  await requireDashboardAccess({
    locale,
    moduleFlags: ["dashboardOrders"],
    returnTo: "/dashboard/orders",
  });

  const t = await getTranslations("dashboardOrders");
  const query = await searchParams;

  const rawPage = Number(Array.isArray(query.page) ? query.page[0] : query.page);
  const page = Number.isFinite(rawPage) && rawPage >= 1 ? Math.floor(rawPage) : 1;
  const rawStatus = Array.isArray(query.status) ? query.status[0] : query.status;
  const status = (MANAGED_ORDER_STATUSES as readonly string[]).includes(rawStatus ?? "")
    ? rawStatus
    : undefined;

  const token = await getAccessToken();
  const orders = await manageOrdersApi.list(token ?? "", { page, pageSize: 20, status });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold">{t("title")}</h1>
        <p className="mt-1 text-muted-foreground">{t("intro")}</p>
      </div>
      <ManagedOrdersTable page={orders} activeStatus={status} />
    </div>
  );
}
