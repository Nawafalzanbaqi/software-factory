import { getLocale, getTranslations } from "next-intl/server";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { formatPrice } from "@/lib/utils";
import type { Locale } from "@/lib/i18n/routing";
import type { OrderDto } from "@/lib/api/types";
import { OrderStatusBadge } from "./OrderStatusBadge";
import { formatDateTime, localizeOrderItemName } from "../types";

/**
 * Reusable order summary card (order number, status, line items, total). Server
 * Component intended for reuse on the checkout success screen and anywhere an
 * OrderDto needs a compact recap.
 */
export async function OrderSummary({
  order,
  className,
}: {
  order: OrderDto;
  className?: string;
}) {
  const locale = (await getLocale()) as Locale;
  const t = await getTranslations("orders");

  return (
    <Card className={className}>
      <CardContent className="space-y-4 p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1">
            <h2 className="font-medium">{t("summaryTitle")}</h2>
            <p className="text-sm text-muted-foreground tabular-nums">
              {t("orderNumber")}: {order.orderNumber}
            </p>
            <p className="text-sm text-muted-foreground">
              {t("placedAt")}{" "}
              <time dateTime={order.placedAt} className="tabular-nums">
                {formatDateTime(order.placedAt, locale)}
              </time>
            </p>
          </div>
          <OrderStatusBadge status={order.status} />
        </div>

        <Separator />

        <ul className="space-y-3">
          {order.items.map((item, i) => (
            <li
              key={`${item.productId}-${i}`}
              className="flex items-start justify-between gap-4 text-sm"
            >
              <span className="min-w-0">
                <span className="block truncate font-medium">
                  {localizeOrderItemName(item, locale)}
                </span>
                <span className="text-muted-foreground">
                  {t("quantityShort")}: <span className="tabular-nums">{item.quantity}</span>
                </span>
              </span>
              <span className="shrink-0 tabular-nums">
                {formatPrice(item.price * item.quantity, order.currency, locale)}
              </span>
            </li>
          ))}
        </ul>

        <Separator />

        <div className="flex items-center justify-between text-base font-semibold">
          <span>{t("total")}</span>
          <span className="tabular-nums">
            {formatPrice(order.total, order.currency, locale)}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
