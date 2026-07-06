"use client";

import { useTransition } from "react";
import { useTranslations } from "next-intl";
import { useRouter, usePathname } from "@/lib/i18n/navigation";
import { Label } from "@/components/ui/label";
import { SORT_OPTIONS, type SortOption } from "../types";

/**
 * Interactive leaf: sort control. Writes the choice to the URL (?sort=) so the
 * server component re-fetches — keeps listing data on the server, state in the URL.
 */
export function ProductFilters({
  currentSort,
  currentSearch,
  currentCategory,
}: {
  currentSort?: SortOption;
  currentSearch?: string;
  currentCategory?: string;
}) {
  const t = useTranslations("products");
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  function onSortChange(sort: string) {
    const params = new URLSearchParams();
    if (sort) params.set("sort", sort);
    if (currentSearch) params.set("search", currentSearch);
    // Preserve the active category chip — sort and category are independent.
    if (currentCategory) params.set("category", currentCategory);
    const qs = params.toString();
    startTransition(() => {
      router.replace(qs ? `${pathname}?${qs}` : pathname);
    });
  }

  return (
    <div className="flex items-center gap-2">
      <Label htmlFor="sort" className="text-muted-foreground">
        {t("sortLabel")}
      </Label>
      <select
        id="sort"
        value={currentSort ?? "newest"}
        disabled={isPending}
        onChange={(e) => onSortChange(e.target.value)}
        className="h-10 cursor-pointer rounded-md border border-input bg-background px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      >
        {SORT_OPTIONS.map((option) => (
          <option key={option} value={option}>
            {t(`sort.${option}`)}
          </option>
        ))}
      </select>
    </div>
  );
}
