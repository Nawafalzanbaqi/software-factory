import { getTranslations } from "next-intl/server";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type { OrderTrackingDto } from "@/lib/api/types";
import { OrderStatusBadge } from "./OrderStatusBadge";
import { OrderTimeline } from "./OrderTimeline";
import { CopyOrderNumber } from "./CopyOrderNumber";

/**
 * Server Component order-tracking view. Renders the current status prominently
 * plus the accessible chronological timeline. The only interactive island is the
 * copy-order-number leaf (CopyOrderNumber).
 */
export async function OrderTracking({
  tracking,
}: {
  tracking: OrderTrackingDto;
}) {
  const t = await getTranslations("orders");

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <header className="space-y-2">
        <h1 className="font-display text-2xl font-semibold sm:text-3xl">
          {t("trackingTitle")}
        </h1>
        <p className="text-sm text-muted-foreground">{t("trackingSubtitle")}</p>
      </header>

      <Card>
        <CardContent className="space-y-4 p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">{t("orderNumber")}</p>
              <p className="font-medium tabular-nums">{tracking.orderNumber}</p>
            </div>
            <CopyOrderNumber orderNumber={tracking.orderNumber} />
          </div>

          <Separator />

          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="text-sm text-muted-foreground">
              {t("currentStatus")}
            </span>
            <OrderStatusBadge status={tracking.status} />
          </div>
        </CardContent>
      </Card>

      <section aria-labelledby="order-timeline-heading" className="space-y-4">
        <h2 id="order-timeline-heading" className="font-medium">
          {t("timelineTitle")}
        </h2>
        <OrderTimeline timeline={tracking.timeline} />
      </section>
    </div>
  );
}
