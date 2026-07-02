import { getLocale, getTranslations } from "next-intl/server";
import { Badge } from "@/components/ui/badge";
import type { Locale } from "@/lib/i18n/routing";
import type { ReservationDto } from "../types";

/**
 * Reservation tracking view (Server Component). Renders a single reservation's
 * status, party size and date/time as an accessible description list (<dl>), with
 * a locale-aware, machine-readable <time> for the booking moment. The status label
 * is i18n-driven with a graceful fallback to the raw backend value for statuses we
 * don't yet translate.
 */
export async function ReservationStatus({
  reservation,
  branchName,
}: {
  reservation: ReservationDto;
  branchName?: string;
}) {
  const t = await getTranslations("reservations");
  const locale = (await getLocale()) as Locale;

  const statusKey = `status.${reservation.status}`;
  const statusLabel = t.has(statusKey) ? t(statusKey) : reservation.status;
  const dateValue = new Date(reservation.dateTime);
  const dateValid = !Number.isNaN(dateValue.getTime());
  const dateLabel = dateValid
    ? new Intl.DateTimeFormat(locale === "ar" ? "ar-SA" : "en-US", {
        dateStyle: "full",
        timeStyle: "short",
      }).format(dateValue)
    : reservation.dateTime;

  return (
    <section
      aria-labelledby="reservation-status-heading"
      className="container section-y"
    >
      <div className="mx-auto max-w-xl">
        <div className="mb-6 text-center">
          <h1
            id="reservation-status-heading"
            className="font-display text-3xl font-semibold sm:text-4xl"
          >
            {t("track.title")}
          </h1>
          <p className="mt-2 text-muted-foreground">
            {t("track.referenceLabel")}{" "}
            <span className="font-mono font-semibold text-foreground" dir="ltr">
              {reservation.reference}
            </span>
          </p>
        </div>

        <dl className="divide-y divide-border rounded-lg border border-input">
          <div className="flex items-center justify-between gap-4 px-4 py-3">
            <dt className="text-sm text-muted-foreground">
              {t("track.status")}
            </dt>
            <dd>
              <Badge>{statusLabel}</Badge>
            </dd>
          </div>

          {branchName && (
            <div className="flex items-center justify-between gap-4 px-4 py-3">
              <dt className="text-sm text-muted-foreground">
                {t("track.branch")}
              </dt>
              <dd className="text-sm font-medium">{branchName}</dd>
            </div>
          )}

          <div className="flex items-center justify-between gap-4 px-4 py-3">
            <dt className="text-sm text-muted-foreground">
              {t("track.partySize")}
            </dt>
            <dd className="text-sm font-medium">
              {t("form.partySizeOption", { count: reservation.partySize })}
            </dd>
          </div>

          <div className="flex items-center justify-between gap-4 px-4 py-3">
            <dt className="text-sm text-muted-foreground">
              {t("track.dateTime")}
            </dt>
            <dd className="text-sm font-medium">
              {dateValid ? (
                <time dateTime={dateValue.toISOString()}>{dateLabel}</time>
              ) : (
                dateLabel
              )}
            </dd>
          </div>

          <div className="flex items-center justify-between gap-4 px-4 py-3">
            <dt className="text-sm text-muted-foreground">
              {t("track.name")}
            </dt>
            <dd className="text-sm font-medium">{reservation.customerName}</dd>
          </div>
        </dl>
      </div>
    </section>
  );
}
