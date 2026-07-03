import "server-only";
import { forbidden, notFound } from "next/navigation";
import type { Session } from "next-auth";
import { redirect } from "@/lib/i18n/navigation";
import type { Locale } from "@/lib/i18n/routing";
import { getSession } from "@/lib/auth";
import { isFeatureEnabled } from "@/lib/config/options";
import type { FeatureName } from "@/lib/config/types";
import type { DashboardRole } from "@/lib/auth/roles";
import { decideDashboardAccess } from "./access";

export interface DashboardGuardOptions {
  locale: Locale;
  /**
   * The page's module flag(s) (features.dashboard*). ALL must be on —
   * e.g. the content module requires dashboardContent AND cms.
   */
  moduleFlags?: FeatureName[];
  /** Owner-only surface (users & roles). */
  ownerOnly?: boolean;
  /** Where sign-in should return to (relative path, defaults to /dashboard). */
  returnTo?: string;
}

export interface DashboardAccess {
  session: Session;
  role: DashboardRole;
}

/**
 * Server guard for every /dashboard page + the dashboard layout.
 * Flag off => 404 · no session => redirect to /sign-in (with callbackUrl) ·
 * wrong/missing role => 403 (authInterrupts forbidden()).
 */
export async function requireDashboardAccess({
  locale,
  moduleFlags = [],
  ownerOnly = false,
  returnTo = "/dashboard",
}: DashboardGuardOptions): Promise<DashboardAccess> {
  const dashboardEnabled = await isFeatureEnabled("clientDashboard");

  let moduleEnabled = true;
  for (const flag of moduleFlags) {
    if (!(await isFeatureEnabled(flag))) {
      moduleEnabled = false;
      break;
    }
  }

  const session = await getSession();
  const decision = decideDashboardAccess({
    dashboardEnabled,
    moduleEnabled,
    user: session?.user ?? null,
    ownerOnly,
  });

  switch (decision.kind) {
    case "not-found":
      notFound();
      break;
    case "sign-in":
      redirect({
        href: { pathname: "/sign-in", query: { callbackUrl: returnTo } },
        locale,
      });
      break;
    case "forbidden":
      forbidden();
      break;
  }

  // decision.kind === "ok" — the throws above never fall through.
  return { session: session as Session, role: (decision as { role: DashboardRole }).role };
}
