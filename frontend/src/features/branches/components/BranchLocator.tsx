import { getTranslations } from "next-intl/server";
import type { Locale } from "@/lib/i18n/routing";
import { buildLocalBusinessJsonLd } from "@/lib/seo/jsonld";
import { JsonLd } from "@/lib/seo/json-ld";
import { branchesApi } from "../api/branchesApi";
import {
  hasGeo,
  localizeBranch,
  toSchemaOpeningHours,
  type BranchDto,
} from "../types";
import { BranchList } from "./BranchList";
import { BranchMap } from "./BranchMap";

/**
 * Full branch-locator page body (Server Component): interactive map + accessible
 * list of every branch, plus one LocalBusiness JSON-LD block per branch. Degrades
 * to an empty-state message on API failure / no branches.
 */
export async function BranchLocator({ locale }: { locale: Locale }) {
  const t = await getTranslations({ locale, namespace: "branches" });

  let branches: BranchDto[] = [];
  try {
    branches = await branchesApi.list();
  } catch {
    branches = [];
  }

  return (
    <div className="container section-y">
      <header className="mb-8 max-w-2xl">
        <h1 className="font-display text-3xl font-semibold">{t("page.title")}</h1>
        <p className="mt-2 text-muted-foreground">{t("page.subtitle")}</p>
      </header>

      {branches.length === 0 ? (
        <p className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
          {t("emptyState")}
        </p>
      ) : (
        <>
          {branches.map((branch) => {
            const { name, address } = localizeBranch(branch, locale);
            return (
              <JsonLd
                key={branch.id}
                data={buildLocalBusinessJsonLd({
                  name,
                  telephone: branch.phone || undefined,
                  address: address
                    ? { streetAddress: address, addressLocality: branch.city }
                    : undefined,
                  geo: hasGeo(branch)
                    ? { latitude: branch.latitude, longitude: branch.longitude }
                    : undefined,
                  openingHours: toSchemaOpeningHours(branch.openingHours ?? []),
                })}
              />
            );
          })}

          <div className="space-y-8">
            <BranchMap branches={branches} />
            <BranchList branches={branches} locale={locale} />
          </div>
        </>
      )}
    </div>
  );
}
