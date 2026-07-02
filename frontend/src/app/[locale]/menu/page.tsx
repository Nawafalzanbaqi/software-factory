import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { setRequestLocale, getTranslations } from "next-intl/server";
import type { Locale } from "@/lib/i18n/routing";
import { buildMetadata } from "@/lib/seo/metadata";
import { getSiteType } from "@/lib/config/options";
import { MenuListing } from "@/features/menu";

// ISR: the listing shell is static; MenuListing fetches with its own revalidate
// window. The active category is read from the URL (?category).
export const revalidate = 300;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "menu" });
  return buildMetadata({
    locale,
    title: t("title"),
    description: t("subtitle"),
    path: "/menu",
  });
}

export default async function MenuPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: Locale }>;
  searchParams: Promise<{ category?: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  // Restaurant-only route: 404 in any other vertical (PHASE2.md §5).
  if ((await getSiteType()) !== "restaurant") notFound();

  const sp = await searchParams;

  return (
    <div className="container section-y">
      <MenuListing category={sp.category} />
    </div>
  );
}
