import type { Metadata } from "next";
import { setRequestLocale, getTranslations } from "next-intl/server";
import type { Locale } from "@/lib/i18n/routing";
import { buildMetadata } from "@/lib/seo/metadata";
import { JsonLd } from "@/lib/seo/json-ld";
import {
  faqApi,
  FaqAccordion,
  buildFaqPageJsonLd,
  faqEntriesFromMessages,
} from "@/features/faq";
import type { FaqEntry, FaqMessageItem } from "@/features/faq";

// CMS-driven content: ISR shell, revalidated periodically (mirrors product pages).
export const revalidate = 600;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "faq" });
  return buildMetadata({
    locale,
    title: t("title"),
    description: t("subtitle"),
    path: "/faq",
  });
}

export default async function FaqPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "faq" });

  const cmsEntries = await faqApi.getEntries(locale);
  const entries: FaqEntry[] =
    cmsEntries.length > 0
      ? cmsEntries
      : faqEntriesFromMessages((t.raw("items") as FaqMessageItem[] | undefined) ?? []);

  return (
    <div className="container section-y">
      {entries.length > 0 && <JsonLd data={buildFaqPageJsonLd(entries)} />}
      <div className="mx-auto max-w-3xl">
        <header className="mb-8">
          <h1 className="font-display text-3xl font-semibold sm:text-4xl">
            {t("title")}
          </h1>
          <p className="mt-2 text-muted-foreground">{t("subtitle")}</p>
        </header>
        <FaqAccordion entries={entries} />
      </div>
    </div>
  );
}
