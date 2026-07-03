import { getLocale, getTranslations } from "next-intl/server";
import type { Locale } from "@/lib/i18n/routing";
import { formatPrice } from "@/lib/utils";
import {
  OrderStatusBadge,
  OrderTimeline,
  formatDateTime,
  localizeOrderItemName,
  type OrderItemDto,
  type OrderTimelineEntry,
} from "@/features/orders";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type { ManagedOrderDto } from "../types";
import { StatusTransitionForm } from "./StatusTransitionForm";

/**
 * Staff-facing order detail: customer + payment context, line items, status
 * transition and the lifecycle timeline (timeline/badge components reused from
 * the public orders feature via its barrel).
 */
export async function ManagedOrderDetail({ order }: { order: ManagedOrderDto }) {
  const locale = (await getLocale()) as Locale;
  const t = await getTranslations("dashboardOrders");

  const items = order.items ?? [];
  const currency = order.currency ?? "SAR";
  const timeline: OrderTimelineEntry[] = (order.timeline ?? []).map((point) => ({
    status: point.status ?? "",
    at: point.at ?? "",
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold">
            {t("detailTitle", { orderNumber: order.orderNumber ?? "" })}
          </h1>
          {order.placedAt && (
            <p className="mt-1 text-sm text-muted-foreground">
              {t("placedAt", { date: formatDateTime(order.placedAt, locale) })}
            </p>
          )}
        </div>
        <OrderStatusBadge status={order.status ?? ""} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{t("transitionTitle")}</CardTitle>
        </CardHeader>
        <CardContent>
          <StatusTransitionForm
            orderNumber={order.orderNumber ?? ""}
            currentStatus={order.status ?? ""}
          />
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{t("customerTitle")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            <p className="font-medium">{order.customerName}</p>
            <p className="text-muted-foreground">{order.customerEmail}</p>
            <p className="text-muted-foreground" dir="ltr">
              {order.customerPhone}
            </p>
            <Separator className="my-3" />
            <p className="text-muted-foreground">
              {t("paymentMethod", { method: order.paymentMethod ?? "" })}
            </p>
            {order.shippingAddress && (
              <p className="text-muted-foreground">
                {t("shippingTo", {
                  address: [
                    order.shippingAddress.line,
                    order.shippingAddress.city,
                    order.shippingAddress.country,
                  ]
                    .filter(Boolean)
                    .join(", "),
                })}
              </p>
            )}
            {order.fulfillment && (
              <p className="text-muted-foreground">
                {t("fulfillmentType", { type: order.fulfillment.type ?? "" })}
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{t("timelineTitle")}</CardTitle>
          </CardHeader>
          <CardContent>
            <OrderTimeline timeline={timeline} />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{t("itemsTitle")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[28rem] text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th scope="col" className="py-2 text-start font-medium">
                    {t("colItem")}
                  </th>
                  <th scope="col" className="py-2 text-start font-medium">
                    {t("colQty")}
                  </th>
                  <th scope="col" className="py-2 text-end font-medium">
                    {t("colLineTotal")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, index) => (
                  <tr key={`${item.productId}-${index}`} className="border-b border-border last:border-b-0">
                    <td className="py-2">
                      {localizeOrderItemName(item as OrderItemDto, locale)}
                      <span className="ms-2 text-muted-foreground">
                        {formatPrice(item.price ?? 0, currency, locale)}
                      </span>
                    </td>
                    <td className="py-2">{item.quantity}</td>
                    <td className="py-2 text-end">
                      {formatPrice(item.lineTotal ?? 0, currency, locale)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Separator className="my-3" />
          <p className="text-end text-base font-semibold">
            {t("total", { total: formatPrice(order.total ?? 0, currency, locale) })}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
