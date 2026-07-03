import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { isLocale } from "@/lib/i18n/routing";
import { DashboardShell, requireDashboardAccess } from "@/features/dashboard";

// Session-gated area: always dynamic, never prerendered.
export const dynamic = "force-dynamic";

/**
 * Client dashboard layout (Phase 4). The §6 gate lives here AND in every
 * child page (pages re-run on soft navigation; the layout alone is not a
 * request-level guard): flag off => 404 · guest => /sign-in · wrong role =>
 * 403. Layout params are typed broad (string) per Next's layout contract and
 * validated like the root [locale] layout.
 */
export default async function DashboardLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) {
    notFound();
  }
  setRequestLocale(locale);

  const { role } = await requireDashboardAccess({ locale });

  return <DashboardShell role={role}>{children}</DashboardShell>;
}
