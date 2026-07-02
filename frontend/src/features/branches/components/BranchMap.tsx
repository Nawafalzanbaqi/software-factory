"use client";

import { useMemo } from "react";
import dynamic from "next/dynamic";
import { useLocale, useTranslations } from "next-intl";
import type { Locale } from "@/lib/i18n/routing";
import { hasGeo, localizeBranch, type BranchDto } from "../types";

/**
 * Client wrapper for the branch locator map. `next/dynamic({ ssr: false })` must
 * live in a Client Component — this is that boundary. Leaflet is code-split and
 * only loaded in the browser (it depends on `window`).
 *
 * Accessibility: the map is inherently visual, so we render an equivalent, always
 * present text fallback list (`sr-only`) inside the same labelled region. The
 * region carries an `aria-label`; the fallback list gives assistive-tech users the
 * same name/address/phone data the markers convey visually.
 */
const BranchMapView = dynamic(() => import("./BranchMapView"), {
  ssr: false,
  loading: () => <MapSkeleton />,
});

function MapSkeleton() {
  return (
    <div
      className="flex h-full w-full items-center justify-center bg-muted"
      role="status"
      aria-live="polite"
    >
      <MapLoadingLabel />
    </div>
  );
}

function MapLoadingLabel() {
  const t = useTranslations("branches");
  return <span className="text-sm text-muted-foreground">{t("map.loading")}</span>;
}

export function BranchMap({ branches }: { branches: BranchDto[] }) {
  const locale = useLocale() as Locale;
  const t = useTranslations("branches");
  const geoBranches = useMemo(() => branches.filter(hasGeo), [branches]);

  return (
    <div
      role="region"
      aria-label={t("map.ariaLabel")}
      className="relative overflow-hidden rounded-xl border"
    >
      <div className="h-[320px] w-full sm:h-[420px] md:h-[480px]">
        <BranchMapView branches={geoBranches} />
      </div>

      {/* Non-map fallback: equivalent content for assistive tech / no-JS. */}
      <div className="sr-only">
        <h3>{t("map.fallbackHeading")}</h3>
        <ul>
          {geoBranches.map((branch) => {
            const { name, address } = localizeBranch(branch, locale);
            return (
              <li key={branch.id}>
                {name}
                {address ? `, ${address}` : ""}
                {branch.phone ? `, ${branch.phone}` : ""}
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
