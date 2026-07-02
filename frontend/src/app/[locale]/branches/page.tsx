import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { setRequestLocale, getTranslations } from "next-intl/server";
import type { Locale } from "@/lib/i18n/routing";
import { buildMetadata } from "@/lib/seo/metadata";
import { getSiteType, isFeatureEnabled } from "@/lib/config/options";
import { BranchLocator } from "@/features/branches";

// ISR: the locator shell is static; BranchLocator fetches with its own revalidate
// window. Branch data changes rarely.
export const revalidate = 900;

/** Restaurant-only + branchLocator feature gate (PHASE2.md §5). */
async function ensureEnabled() {
  const [siteType, enabled] = await Promise.all([
    getSiteType(),
    isFeatureEnabled("branchLocator"),
  ]);
  if (siteType !== "restaurant" || !enabled) notFound();
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "branches" });
  return buildMetadata({
    locale,
    title: t("metaTitle"),
    description: t("metaDescription"),
    path: "/branches",
  });
}

export default async function BranchesPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  await ensureEnabled();

  return <BranchLocator locale={locale} />;
}
