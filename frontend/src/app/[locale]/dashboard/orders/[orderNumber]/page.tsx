import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { setRequestLocale, getTranslations } from "next-intl/server";
import type { Locale } from "@/lib/i18n/routing";
import { buildMetadata } from "@/lib/seo/metadata";
import { getAccessToken } from "@/lib/auth";
import { ApiError } from "@/lib/api/client";
import { requireDashboardAccess } from "@/features/dashboard";
import { ManagedOrderDetail, manageOrdersApi } from "@/features/dashboard-orders";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale; orderNumber: string }>;
}): Promise<Metadata> {
  const { locale, orderNumber } = await params;
  const t = await getTranslations({ locale, namespace: "dashboardOrders" });
  return buildMetadata({
    locale,
    title: t("detailTitle", { orderNumber: decodeURIComponent(orderNumber) }),
    description: t("intro"),
    path: `/dashboard/orders/${orderNumber}`,
    noIndex: true,
  });
}

/** Staff-facing order detail + status transitions (features.dashboardOrders). */
export default async function DashboardOrderDetailPage({
  params,
}: {
  params: Promise<{ locale: Locale; orderNumber: string }>;
}) {
  const { locale, orderNumber } = await params;
  setRequestLocale(locale);

  await requireDashboardAccess({
    locale,
    moduleFlags: ["dashboardOrders"],
    returnTo: `/dashboard/orders/${orderNumber}`,
  });

  const token = await getAccessToken();

  let order;
  try {
    order = await manageOrdersApi.get(token ?? "", decodeURIComponent(orderNumber));
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) notFound();
    throw error;
  }

  return <ManagedOrderDetail order={order} />;
}
