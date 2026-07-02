import { getTranslations } from "next-intl/server";
import type { Locale } from "@/lib/i18n/routing";
import { localizeBranch, osmDirectionsUrl, type BranchDto } from "../types";

/**
 * Server-rendered branch card: name, address, phone and weekly hours. Pure display
 * (no client JS) — the interactive map lives in BranchMap.
 */
export async function BranchCard({
  branch,
  locale,
}: {
  branch: BranchDto;
  locale: Locale;
}) {
  const t = await getTranslations({ locale, namespace: "branches" });
  const { name, address } = localizeBranch(branch, locale);
  const hours = branch.openingHours ?? [];

  return (
    <article className="flex h-full flex-col rounded-xl border bg-card p-5 shadow-sm">
      <h3 className="font-display text-lg font-semibold">{name}</h3>

      {address ? (
        <p className="mt-2 flex items-start gap-2 text-sm text-muted-foreground">
          <span className="sr-only">{t("card.addressLabel")}: </span>
          <span>{address}</span>
        </p>
      ) : null}

      {branch.phone ? (
        <p className="mt-1 text-sm">
          <span className="sr-only">{t("card.phoneLabel")}: </span>
          <a
            className="text-primary underline-offset-4 hover:underline focus-visible:underline"
            href={`tel:${branch.phone.replace(/\s+/g, "")}`}
          >
            {branch.phone}
          </a>
        </p>
      ) : null}

      {hours.length > 0 ? (
        <div className="mt-4">
          <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {t("card.hoursLabel")}
          </h4>
          <dl className="mt-2 space-y-1 text-sm">
            {hours.map((h, i) => (
              <div key={`${h.day}-${i}`} className="flex justify-between gap-4">
                <dt className="capitalize text-muted-foreground">{h.day}</dt>
                <dd className="font-medium">
                  {h.closed || !h.opens || !h.closes
                    ? t("card.closed")
                    : `${h.opens} – ${h.closes}`}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      ) : null}

      <a
        className="mt-4 inline-flex w-fit items-center text-sm font-medium text-primary underline-offset-4 hover:underline focus-visible:underline"
        href={osmDirectionsUrl(branch)}
        target="_blank"
        rel="noopener noreferrer"
      >
        {t("card.getDirections")}
        <span className="sr-only"> — {name}</span>
      </a>
    </article>
  );
}
