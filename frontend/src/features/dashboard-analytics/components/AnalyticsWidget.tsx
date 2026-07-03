import { getLocale, getTranslations } from "next-intl/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getAnalyticsProvider } from "../providers/analytics-provider";

/**
 * Overview analytics widget (features.analytics). Server component: reads the
 * active IAnalyticsProvider — NoOp today, so it honestly reports "not
 * connected" zeros instead of fabricated numbers. Number formatting is
 * locale-aware (Arabic-Indic digits in ar).
 */
export async function AnalyticsWidget({ days = 30 }: { days?: number }) {
  const t = await getTranslations("dashboardAnalytics");
  const locale = await getLocale();
  const summary = await getAnalyticsProvider().getSummary(days);
  const nf = new Intl.NumberFormat(locale === "ar" ? "ar-SA" : "en-US");

  return (
    <Card data-testid="analytics-widget">
      <CardHeader>
        <CardTitle className="text-lg">{t("title", { days })}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!summary.connected && (
          <p className="rounded-md bg-muted px-3 py-2 text-sm text-muted-foreground">
            {t("notConnected")}
          </p>
        )}
        <dl className="grid grid-cols-2 gap-4">
          <div>
            <dt className="text-sm text-muted-foreground">{t("visitors")}</dt>
            <dd className="font-display text-3xl font-semibold">{nf.format(summary.visitors)}</dd>
          </div>
          <div>
            <dt className="text-sm text-muted-foreground">{t("pageviews")}</dt>
            <dd className="font-display text-3xl font-semibold">{nf.format(summary.pageviews)}</dd>
          </div>
        </dl>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <h3 className="mb-2 text-sm font-medium">{t("topPages")}</h3>
            {summary.topPages.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t("noData")}</p>
            ) : (
              <ul className="space-y-1 text-sm">
                {summary.topPages.map((page) => (
                  <li key={page.path} className="flex justify-between gap-2">
                    <span className="truncate" dir="ltr">
                      {page.path}
                    </span>
                    <span className="text-muted-foreground">{nf.format(page.pageviews)}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div>
            <h3 className="mb-2 text-sm font-medium">{t("sources")}</h3>
            {summary.sources.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t("noData")}</p>
            ) : (
              <ul className="space-y-1 text-sm">
                {summary.sources.map((source) => (
                  <li key={source.source} className="flex justify-between gap-2">
                    <span className="truncate">{source.source}</span>
                    <span className="text-muted-foreground">{nf.format(source.visitors)}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
