import { getTranslations } from "next-intl/server";
import { Link } from "@/lib/i18n/navigation";
import { Button } from "@/components/ui/button";

/**
 * Localized 403 (authInterrupts forbidden()). Rendered inside the [locale]
 * layout so header/footer persist — thrown by the dashboard role gate when a
 * signed-in account lacks a dashboard role (or staff hits an owner-only page).
 */
export default async function Forbidden() {
  const t = await getTranslations("dashboard");
  return (
    <div className="container flex min-h-[50vh] flex-col items-center justify-center gap-4 py-20 text-center">
      <p className="font-display text-6xl font-semibold text-muted-foreground">403</p>
      <h1 className="font-display text-2xl font-semibold">{t("forbiddenTitle")}</h1>
      <p className="max-w-md text-muted-foreground">{t("forbiddenBody")}</p>
      <Button asChild>
        <Link href="/">{t("backHome")}</Link>
      </Button>
    </div>
  );
}
