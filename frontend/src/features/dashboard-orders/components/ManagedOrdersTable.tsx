import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/lib/i18n/navigation";
import type { Locale } from "@/lib/i18n/routing";
import { formatPrice, cn } from "@/lib/utils";
import { OrderStatusBadge, formatDateTime, normalizeStatus } from "@/features/orders";
import { Button } from "@/components/ui/button";
import type { ManagedOrdersPage } from "../types";
import { MANAGED_ORDER_STATUSES } from "../types";

/**
 * Store-wide orders table (server component). Status filter + pagination are
 * plain links (?status=&page=) so the table works without client JS. Currency
 * and dates render locale-aware; layout uses logical utilities for RTL.
 */
export async function ManagedOrdersTable({
  page,
  activeStatus,
}: {
  page: ManagedOrdersPage;
  activeStatus?: string;
}) {
  const locale = (await getLocale()) as Locale;
  const t = await getTranslations("dashboardOrders");
  const tOrders = await getTranslations("orders");

  const items = page.items ?? [];
  const current = page.page ?? 1;
  const totalPages = page.totalPages ?? 1;

  const filterHref = (status?: string) => ({
    pathname: "/dashboard/orders",
    query: status ? { status } : undefined,
  });

  return (
    <div className="space-y-4">
      <nav aria-label={t("filterLabel")} className="flex flex-wrap gap-2">
        <Link
          href={filterHref()}
          className={cn(
            "rounded-full border px-3 py-1 text-sm",
            !activeStatus
              ? "border-accent bg-accent/10 text-accent"
              : "border-border text-muted-foreground hover:text-foreground",
          )}
        >
          {t("filterAll")}
        </Link>
        {MANAGED_ORDER_STATUSES.map((status) => (
          <Link
            key={status}
            href={filterHref(status)}
            className={cn(
              "rounded-full border px-3 py-1 text-sm",
              activeStatus === status
                ? "border-accent bg-accent/10 text-accent"
                : "border-border text-muted-foreground hover:text-foreground",
            )}
          >
            {tOrders(`status.${normalizeStatus(status)}`)}
          </Link>
        ))}
      </nav>

      {items.length === 0 ? (
        <p className="rounded-md border border-dashed border-border p-8 text-center text-muted-foreground">
          {t("empty")}
        </p>
      ) : (
        <div className="overflow-x-auto rounded-md border border-border">
          <table className="w-full min-w-[40rem] text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50 text-start">
                <th scope="col" className="px-4 py-3 text-start font-medium">
                  {t("colOrder")}
                </th>
                <th scope="col" className="px-4 py-3 text-start font-medium">
                  {t("colStatus")}
                </th>
                <th scope="col" className="px-4 py-3 text-start font-medium">
                  {t("colTotal")}
                </th>
                <th scope="col" className="px-4 py-3 text-start font-medium">
                  {t("colPlacedAt")}
                </th>
                <th scope="col" className="px-4 py-3 text-end font-medium">
                  <span className="sr-only">{t("colActions")}</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {items.map((order) => (
                <tr key={order.orderNumber ?? ""} className="border-b border-border last:border-b-0">
                  <td className="px-4 py-3 font-medium">{order.orderNumber}</td>
                  <td className="px-4 py-3">
                    <OrderStatusBadge status={order.status ?? ""} />
                  </td>
                  <td className="px-4 py-3">
                    {formatPrice(order.total ?? 0, order.currency ?? "SAR", locale)}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {order.placedAt ? formatDateTime(order.placedAt, locale) : "—"}
                  </td>
                  <td className="px-4 py-3 text-end">
                    <Button asChild variant="outline" size="sm">
                      <Link href={`/dashboard/orders/${encodeURIComponent(order.orderNumber ?? "")}`}>
                        {t("view")}
                      </Link>
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 && (
        <nav aria-label={t("paginationLabel")} className="flex items-center justify-between">
          <Button asChild variant="outline" size="sm" disabled={current <= 1}>
            <Link
              href={{
                pathname: "/dashboard/orders",
                query: {
                  page: Math.max(1, current - 1),
                  ...(activeStatus ? { status: activeStatus } : {}),
                },
              }}
              aria-disabled={current <= 1}
            >
              {t("previous")}
            </Link>
          </Button>
          <p className="text-sm text-muted-foreground">
            {t("pageOf", { page: current, totalPages })}
          </p>
          <Button asChild variant="outline" size="sm" disabled={current >= totalPages}>
            <Link
              href={{
                pathname: "/dashboard/orders",
                query: {
                  page: Math.min(totalPages, current + 1),
                  ...(activeStatus ? { status: activeStatus } : {}),
                },
              }}
              aria-disabled={current >= totalPages}
            >
              {t("next")}
            </Link>
          </Button>
        </nav>
      )}
    </div>
  );
}
