import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/lib/i18n/navigation";
import { Separator } from "@/components/ui/separator";
import { getFooterContent } from "@/lib/cms";
import { getPrimaryNav } from "./nav-items";
import type { Locale } from "@/lib/i18n/routing";

/**
 * Footer (Server Component). Copy is CMS-driven with a graceful fallback to i18n
 * messages + config-resolved nav while Payload is not yet wired (getFooterContent
 * currently returns null from the CMS stub).
 */
export async function Footer() {
  const locale = (await getLocale()) as Locale;
  const t = await getTranslations("footer");
  const tc = await getTranslations("common");
  const [cms, primary] = await Promise.all([getFooterContent(), getPrimaryNav()]);

  const year = new Date().getFullYear();
  const tagline = cms?.tagline?.[locale] ?? t("tagline");

  return (
    <footer className="mt-auto border-t bg-secondary/40" role="contentinfo">
      <div className="container section-y grid gap-10 md:grid-cols-4">
        <div className="md:col-span-2">
          <p className="font-display text-lg font-semibold">{tc("brand")}</p>
          <p className="mt-2 max-w-sm text-sm text-muted-foreground">{tagline}</p>
        </div>

        {cms?.columns?.length ? (
          cms.columns.map((col, i) => (
            <nav key={i} aria-label={col.title[locale]} className="text-sm">
              <p className="mb-3 font-semibold">{col.title[locale]}</p>
              <ul className="space-y-2">
                {col.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      {link.label[locale]}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))
        ) : (
          <nav aria-label={t("shop")} className="text-sm">
            <p className="mb-3 font-semibold">{t("shop")}</p>
            <ul className="space-y-2">
              {primary.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    {item.labelKey}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        )}
      </div>

      <Separator />
      <div className="container flex flex-col items-center justify-between gap-2 py-6 text-xs text-muted-foreground sm:flex-row">
        <p>
          © {year} {tc("brand")}. {t("rights")}
        </p>
      </div>
    </footer>
  );
}
