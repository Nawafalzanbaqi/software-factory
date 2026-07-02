import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/lib/i18n/navigation";
import { Button } from "@/components/ui/button";
import type { Locale } from "@/lib/i18n/routing";
import {
  getSiteConfig,
  isFeatureEnabled,
  isSectionEnabled,
} from "@/lib/config/options";
import { buildRestaurantJsonLd } from "@/lib/seo/jsonld";
import { JsonLd } from "@/lib/seo/json-ld";
import { branchesApi } from "../api/branchesApi";
import { hasGeo, localizeBranch, toSchemaOpeningHours, type BranchDto } from "../types";
import { BranchList } from "./BranchList";
import { BranchMap } from "./BranchMap";

/**
 * Homepage "branches" section (Server Component, options.restaurant.json sectionKey
 * "branches"). Returns null when the section OR the `branchLocator` feature flag is
 * disabled, and degrades to nothing on API failure / empty data so it never blocks
 * or breaks the homepage. Emits Restaurant JSON-LD for the primary branch.
 */
export async function BranchesSection() {
  if (
    !(await isSectionEnabled("branches")) ||
    !(await isFeatureEnabled("branchLocator"))
  ) {
    return null;
  }

  const locale = (await getLocale()) as Locale;
  const t = await getTranslations({ locale, namespace: "branches" });

  let branches: BranchDto[] = [];
  try {
    branches = await branchesApi.list();
  } catch {
    branches = [];
  }
  if (branches.length === 0) return null;

  const site = await getSiteConfig();
  const primary = branches.find(hasGeo) ?? branches[0];
  if (!primary) return null;
  const { address: primaryAddress } = localizeBranch(primary, locale);

  return (
    <section aria-labelledby="branches-heading" className="container section-y">
      <JsonLd
        data={buildRestaurantJsonLd({
          name: site.siteName,
          telephone: primary.phone || undefined,
          priceRange: "$$",
          acceptsReservations: true,
          address: primaryAddress
            ? { streetAddress: primaryAddress, addressLocality: primary.city }
            : undefined,
          geo: hasGeo(primary)
            ? { latitude: primary.latitude, longitude: primary.longitude }
            : undefined,
          openingHours: toSchemaOpeningHours(primary.openingHours ?? []),
        })}
      />

      <div className="mb-8 flex items-end justify-between gap-4">
        <div>
          <h2
            id="branches-heading"
            className="font-display text-2xl font-semibold"
          >
            {t("section.title")}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("section.subtitle")}
          </p>
        </div>
        <Button asChild variant="link">
          <Link href="/branches">{t("section.viewAll")}</Link>
        </Button>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <BranchMap branches={branches} />
        <BranchList branches={branches} locale={locale} />
      </div>
    </section>
  );
}
