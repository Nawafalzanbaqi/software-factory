import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import type { Locale } from "@/lib/i18n/routing";
import { routing } from "@/lib/i18n/routing";
import { buildMetadata, SITE_URL } from "@/lib/seo/metadata";
import { buildMenuItemJsonLd } from "@/lib/seo/jsonld";
import { JsonLd } from "@/lib/seo/json-ld";
import { getSiteType } from "@/lib/config/options";
import { menuApi, MenuItemDetail, localizeMenuItem } from "@/features/menu";
import type { MenuItemDto } from "@/features/menu";

// SSG + ISR: pre-render known menu item pages, revalidate periodically.
export const revalidate = 600;
// Allow on-demand rendering for slugs not in generateStaticParams.
export const dynamicParams = true;

/** Pre-build menu item pages for every locale × slug. */
export async function generateStaticParams() {
  const slugs = await menuApi.allSlugs();
  return routing.locales.flatMap((locale) =>
    slugs.map((slug) => ({ locale, slug })),
  );
}

async function fetchItem(slug: string): Promise<MenuItemDto | null> {
  try {
    return await menuApi.getBySlug(slug);
  } catch {
    return null;
  }
}

/** Canonical URL for a menu item (mirrors buildMetadata's localePrefix rules). */
function itemUrl(slug: string, locale: Locale): string {
  return locale === "ar"
    ? `${SITE_URL}/menu/${slug}`
    : `${SITE_URL}/${locale}/menu/${slug}`;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const item = await fetchItem(slug);
  if (!item) {
    return buildMetadata({
      locale,
      title: "Not found",
      description: "",
      path: `/menu/${slug}`,
      noIndex: true,
    });
  }
  const { name, description } = localizeMenuItem(item, locale);
  return buildMetadata({
    locale,
    title: name,
    description,
    path: `/menu/${slug}`,
    images: item.images,
    type: "product",
  });
}

export default async function MenuItemPage({
  params,
}: {
  params: Promise<{ locale: Locale; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  // Restaurant-only route: 404 in any other vertical (PHASE2.md §5).
  if ((await getSiteType()) !== "restaurant") notFound();

  const item = await fetchItem(slug);
  if (!item) notFound();

  const { name, description } = localizeMenuItem(item, locale);

  return (
    <div className="container section-y space-y-12">
      <JsonLd
        data={buildMenuItemJsonLd({
          name,
          description,
          image: item.images,
          price: item.price,
          currency: item.currency,
          url: itemUrl(slug, locale),
        })}
      />
      <MenuItemDetail item={item} />
    </div>
  );
}
