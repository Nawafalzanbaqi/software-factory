import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { setRequestLocale, getTranslations } from "next-intl/server";
import type { Locale } from "@/lib/i18n/routing";
import { buildMetadata } from "@/lib/seo/metadata";
import { isFeatureEnabled } from "@/lib/config/options";
import { SearchBar, SearchResults, SearchResultsSkeleton } from "@/features/search";

// Query-driven and non-indexable: always dynamic, never cached as a static page.
export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "search" });
  return buildMetadata({
    locale,
    title: t("title"),
    description: t("subtitle"),
    path: "/search",
    noIndex: true,
  });
}

export default async function SearchPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: Locale }>;
  searchParams: Promise<{ q?: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  // Feature-flag gate (options.json features.search).
  if (!(await isFeatureEnabled("search"))) notFound();

  const [{ q = "" }, t] = await Promise.all([
    searchParams,
    getTranslations("search"),
  ]);

  return (
    <div className="container section-y space-y-8">
      <header className="space-y-2">
        <h1 className="font-display text-2xl font-semibold">{t("title")}</h1>
        <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
      </header>

      <SearchBar defaultQuery={q} autoFocus />

      {/* Re-suspend whenever the query changes so the skeleton shows per search. */}
      <Suspense key={q} fallback={<SearchResultsSkeleton />}>
        <SearchResults query={q} />
      </Suspense>
    </div>
  );
}
