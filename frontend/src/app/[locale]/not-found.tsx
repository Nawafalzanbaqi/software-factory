import { getTranslations } from "next-intl/server";
import { Link } from "@/lib/i18n/navigation";
import { Button } from "@/components/ui/button";

/** Localized 404. Rendered inside the [locale] layout so header/footer persist. */
export default async function NotFound() {
  const t = await getTranslations("common");
  return (
    <div className="container flex min-h-[50vh] flex-col items-center justify-center gap-4 py-20 text-center">
      <p className="font-display text-6xl font-semibold text-muted-foreground">404</p>
      <h1 className="font-display text-2xl font-semibold">{t("notFoundTitle")}</h1>
      <p className="max-w-md text-muted-foreground">{t("notFoundBody")}</p>
      <Button asChild>
        <Link href="/">{t("backHome")}</Link>
      </Button>
    </div>
  );
}
