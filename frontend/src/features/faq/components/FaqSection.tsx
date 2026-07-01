import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/lib/i18n/navigation";
import { Button } from "@/components/ui/button";
import { isSectionEnabled } from "@/lib/config/options";
import type { Locale } from "@/lib/i18n/routing";
import { faqApi } from "../api/faqApi";
import { faqEntriesFromMessages, type FaqEntry, type FaqMessageItem } from "../types";
import { FaqAccordion } from "./FaqAccordion";

/**
 * Homepage FAQ section (Server Component, sectionKey "faq"). CMS-driven via
 * lib/cms getFaqItems(); gracefully falls back to the i18n `faq.items` catalog
 * while the Payload stub returns []. Honors options.json section gating.
 *
 * The interactive accordion is a small "use client" leaf (FaqAccordion); this
 * shell stays a Server Component so heading/copy render without JS.
 */

// Cap the homepage teaser; the full list lives on /faq.
const HOMEPAGE_MAX = 6;

export async function FaqSection() {
  // Section gating (ARCHITECTURE §0). Renders nothing when sections.faq is off.
  if (!(await isSectionEnabled("faq"))) return null;

  const locale = (await getLocale()) as Locale;
  const t = await getTranslations("faq");

  const cmsEntries = await faqApi.getEntries(locale);
  const entries: FaqEntry[] =
    cmsEntries.length > 0
      ? cmsEntries
      : faqEntriesFromMessages((t.raw("items") as FaqMessageItem[] | undefined) ?? []);

  if (entries.length === 0) return null;

  const visible = entries.slice(0, HOMEPAGE_MAX);
  const hasMore = entries.length > visible.length;

  return (
    <section aria-labelledby="faq-heading" className="container section-y">
      <div className="mx-auto max-w-3xl">
        <div className="mb-8 text-center">
          <h2
            id="faq-heading"
            className="font-display text-2xl font-semibold sm:text-3xl"
          >
            {t("title")}
          </h2>
          <p className="mt-2 text-muted-foreground">{t("subtitle")}</p>
        </div>

        <FaqAccordion entries={visible} />

        {hasMore && (
          <div className="mt-6 text-center">
            <Button asChild variant="link">
              <Link href="/faq">{t("viewAllCta")}</Link>
            </Button>
          </div>
        )}
      </div>
    </section>
  );
}
