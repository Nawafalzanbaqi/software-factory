import { getTranslations } from "next-intl/server";
import { ExternalLink } from "lucide-react";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getContentLinks } from "../lib/links";

/**
 * Server component: options-driven grid of deep links into the Payload admin.
 * Raw <a> on purpose — /admin sits OUTSIDE the [locale] routing (Payload owns
 * its UI and auth), so the locale-aware Link must not prefix it.
 */
export async function ContentLinksGrid() {
  const t = await getTranslations("dashboardContent");
  const links = await getContentLinks();

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {links.map((link) => (
        <a
          key={link.href}
          href={link.href}
          target="_blank"
          rel="noopener noreferrer"
          className="group focus-visible:outline-none"
        >
          <Card className="h-full transition-colors group-hover:border-accent group-focus-visible:border-accent">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                {t(`links.${link.labelKey}`)}
                <ExternalLink className="size-3.5 text-muted-foreground rtl:rotate-180" aria-hidden="true" />
              </CardTitle>
              <CardDescription>{t("openInAdmin")}</CardDescription>
            </CardHeader>
          </Card>
        </a>
      ))}
    </div>
  );
}
