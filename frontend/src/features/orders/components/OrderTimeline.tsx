import { getLocale, getTranslations } from "next-intl/server";
import { cn } from "@/lib/utils";
import type { Locale } from "@/lib/i18n/routing";
import { OrderStatusBadge } from "./OrderStatusBadge";
import { formatDateTime, type OrderTimelineEntry } from "../types";

/**
 * Accessible, chronological order status timeline. Server Component rendering a
 * semantic ordered list (<ol>): each step carries a localized status badge and a
 * machine-readable <time>. The most recent entry is flagged aria-current="step".
 *
 * Timeline entries are expected in ascending (oldest → newest) order per the
 * OrderTrackingDto contract (ARCHITECTURE.md §2).
 */
export async function OrderTimeline({
  timeline,
}: {
  timeline: OrderTimelineEntry[];
}) {
  const locale = (await getLocale()) as Locale;
  const t = await getTranslations("orders");

  if (timeline.length === 0) {
    return <p className="text-sm text-muted-foreground">{t("empty")}</p>;
  }

  const lastIndex = timeline.length - 1;

  return (
    <ol aria-label={t("timelineLabel")} className="space-y-0">
      {timeline.map((entry, i) => {
        const isCurrent = i === lastIndex;
        const isLast = i === lastIndex;

        return (
          <li
            key={`${entry.status}-${entry.at}-${i}`}
            aria-current={isCurrent ? "step" : undefined}
            className="relative flex gap-4 ps-2"
          >
            {/* Connector rail + node (decorative; status conveyed via text/badge). */}
            <div
              className="flex flex-col items-center"
              aria-hidden="true"
            >
              <span
                className={cn(
                  "mt-1 size-3 shrink-0 rounded-full border-2",
                  isCurrent
                    ? "border-accent bg-accent"
                    : "border-primary bg-primary",
                )}
              />
              {!isLast && (
                <span className="w-0.5 flex-1 bg-border" />
              )}
            </div>

            <div className={cn("min-w-0 flex-1", isLast ? "pb-0" : "pb-6")}>
              <div className="flex flex-wrap items-center gap-2">
                <OrderStatusBadge status={entry.status} />
                <span className="sr-only">
                  {isCurrent ? t("stepCurrent") : t("stepCompleted")}
                </span>
              </div>
              <time
                dateTime={entry.at}
                className="mt-1 block text-sm text-muted-foreground tabular-nums"
              >
                {formatDateTime(entry.at, locale)}
              </time>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
