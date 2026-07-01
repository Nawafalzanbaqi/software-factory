import type { Metadata } from "next";
import { setRequestLocale, getTranslations } from "next-intl/server";
import type { Locale } from "@/lib/i18n/routing";
import { buildMetadata } from "@/lib/seo/metadata";
import { buildOrganizationJsonLd } from "@/lib/seo/jsonld";
import { JsonLd } from "@/lib/seo/json-ld";
import { getSiteConfig } from "@/lib/config/options";
import { AboutSection } from "@/features/about";

// Static content page; revalidate periodically so CMS edits propagate (ISR).
export const revalidate = 600;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "about" });
  // buildMetadata adds the canonical URL + hreflang alternates for every locale.
  return buildMetadata({
    locale,
    title: t("metaTitle"),
    description: t("metaDescription"),
    path: "/about",
  });
}

export default async function AboutPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const site = await getSiteConfig();

  return (
    <>
      <JsonLd data={buildOrganizationJsonLd({ name: site.siteName })} />
      {/* AboutSection provides its own `container section-y` wrapper. */}
      <AboutSection variant="page" />
    </>
  );
}
