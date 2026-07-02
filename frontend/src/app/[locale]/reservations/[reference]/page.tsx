import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { setRequestLocale, getTranslations } from "next-intl/server";
import type { Locale } from "@/lib/i18n/routing";
import { buildMetadata } from "@/lib/seo/metadata";
import { getSiteType, isFeatureEnabled } from "@/lib/config/options";
import {
  reservationsApi,
  ReservationStatus,
  localizeBranchName,
  type ReservationDto,
} from "@/features/reservations";

// Live tracking: a reservation's status changes over time, so never cache. The
// route also depends on request state (notFound), so keep it fully dynamic.
export const dynamic = "force-dynamic";

/** Restaurant-only + reservations-flag gate shared by metadata and the page. */
async function ensureEnabled() {
  const [siteType, reservationsEnabled] = await Promise.all([
    getSiteType(),
    isFeatureEnabled("reservations"),
  ]);
  return siteType === "restaurant" && reservationsEnabled;
}

async function fetchReservation(reference: string): Promise<ReservationDto | null> {
  try {
    return await reservationsApi.getByReference(reference);
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale; reference: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "reservations" });
  // Tracking pages are private (contain a customer's booking) — never index.
  return buildMetadata({
    locale,
    title: t("meta.trackTitle"),
    description: t("meta.trackDescription"),
    path: "/reservations",
    noIndex: true,
  });
}

export default async function ReservationTrackingPage({
  params,
}: {
  params: Promise<{ locale: Locale; reference: string }>;
}) {
  const { locale, reference } = await params;
  setRequestLocale(locale);

  if (!(await ensureEnabled())) notFound();

  const reservation = await fetchReservation(reference);
  if (!reservation) notFound();

  // Best-effort branch-name resolution (branches list is small + ISR-cached).
  let branchName: string | undefined;
  try {
    const branches = await reservationsApi.listBranches();
    const branch = branches.find((b) => b.id === reservation.branchId);
    branchName = branch ? localizeBranchName(branch, locale) : undefined;
  } catch {
    branchName = undefined;
  }

  return <ReservationStatus reservation={reservation} branchName={branchName} />;
}
