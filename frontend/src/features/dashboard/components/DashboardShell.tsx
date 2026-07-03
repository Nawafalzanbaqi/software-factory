import type { ReactNode } from "react";
import { getTranslations } from "next-intl/server";
import type { DashboardRole } from "@/lib/auth/roles";
import { getDashboardNav } from "../lib/nav";
import { DashboardNavLink } from "./DashboardNavLink";

/**
 * Dashboard chrome: options+role-driven module nav (sidebar on desktop,
 * horizontal scroller on mobile) around the active module. Server Component;
 * logical utilities only so ar/RTL mirrors correctly.
 */
export async function DashboardShell({
  role,
  children,
}: {
  role: DashboardRole;
  children: ReactNode;
}) {
  const t = await getTranslations("dashboard");
  const items = await getDashboardNav(role);

  return (
    <div className="container section-y">
      <div className="flex flex-col gap-6 lg:flex-row lg:gap-10">
        <nav
          aria-label={t("navLabel")}
          className="flex shrink-0 gap-1 overflow-x-auto border-b border-border pb-2 lg:w-52 lg:flex-col lg:border-b-0 lg:border-e lg:pb-0 lg:pe-4"
        >
          {items.map((item) => (
            <DashboardNavLink key={item.href} href={item.href}>
              {t(`nav.${item.labelKey}`)}
            </DashboardNavLink>
          ))}
        </nav>
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </div>
  );
}
