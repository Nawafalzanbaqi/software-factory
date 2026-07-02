import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { setRequestLocale, getTranslations } from "next-intl/server";
import type { Locale } from "@/lib/i18n/routing";
import { buildMetadata } from "@/lib/seo/metadata";
import { buildRestaurantJsonLd } from "@/lib/seo/jsonld";
import { JsonLd } from "@/lib/seo/json-ld";
import { getSiteType, isFeatureEnabled, getSiteConfig } from "@/lib/config/options";
import { ReservationBooking } from "@/features/reservations";

// Static shell; branches are fetched (ISR) server-side and the form is a client
// leaf that posts at runtime. All copy is i18n-driven.
export const revalidate = 300;

/** Restaurant-only + reservations-flag gate shared by metadata and the page. */
async function ensureEnabled() {
  const [siteType, reservationsEnabled] = await Promise.all([
    getSiteType(),
    isFeatureEnabled("reservations"),
  ]);
  return siteType === "restaurant" && reservationsEnabled;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "reservations" });
  return buildMetadata({
    locale,
    title: t("meta.title"),
    description: t("meta.description"),
    path: "/reservations",
    noIndex: !(await ensureEnabled()),
  });
}

export default async function ReservationsPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  if (!(await ensureEnabled())) notFound();

  const site = await getSiteConfig();

  return (
    <>
      <JsonLd
        data={buildRestaurantJsonLd({
          name: site.siteName,
          acceptsReservations: true,
        })}
      />
      <ReservationBooking />
    </>
  );
}
