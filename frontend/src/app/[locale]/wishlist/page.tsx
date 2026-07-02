import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { setRequestLocale, getTranslations } from "next-intl/server";
import type { Locale } from "@/lib/i18n/routing";
import { buildMetadata } from "@/lib/seo/metadata";
import { getSiteType, isFeatureEnabled } from "@/lib/config/options";
import { WishlistView, WishlistSkeleton } from "@/features/wishlist";

// User-specific + auth-gated: always dynamic, never indexed.
export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "wishlist" });
  return buildMetadata({
    locale,
    title: t("title"),
    description: t("subtitle"),
    path: "/wishlist",
    noIndex: true,
  });
}

export default async function WishlistPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  // Ecommerce-only route.
  if ((await getSiteType()) !== "ecommerce") notFound();
  // Feature-flag gate (options.json features.wishlist).
  if (!(await isFeatureEnabled("wishlist"))) notFound();

  const t = await getTranslations("wishlist");

  return (
    <div className="container section-y">
      <h1 className="mb-8 font-display text-2xl font-semibold">{t("title")}</h1>
      <Suspense fallback={<WishlistSkeleton />}>
        <WishlistView />
      </Suspense>
    </div>
  );
}
