"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";

/**
 * Dashboard segment error boundary: operational calls (backend manage API,
 * Payload REST) can fail — surface a localized retry instead of a blank crash.
 */
export default function DashboardError({ reset }: { error: Error; reset: () => void }) {
  const t = useTranslations("dashboard");

  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center gap-4 text-center">
      <h2 className="font-display text-xl font-semibold">{t("errorTitle")}</h2>
      <p className="max-w-md text-muted-foreground">{t("errorBody")}</p>
      <Button onClick={reset}>{t("retry")}</Button>
    </div>
  );
}
