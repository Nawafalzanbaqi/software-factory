import { getTranslations } from "next-intl/server";
import { Search, SearchX } from "lucide-react";
import { Link } from "@/lib/i18n/navigation";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";

/**
 * Server Component empty state for the search page.
 * - `prompt`   → no query entered yet.
 * - `noResults`→ a query was run but returned nothing (shows the term).
 */
export async function SearchEmpty({
  variant,
  query,
}: {
  variant: "prompt" | "noResults";
  query?: string;
}) {
  const t = await getTranslations("search");
  const isPrompt = variant === "prompt";
  const Icon = isPrompt ? Search : SearchX;

  return (
    <EmptyState
      icon={<Icon className="size-6" />}
      message={isPrompt ? t("prompt") : t("noResults", { query: query ?? "" })}
      action={
        <Button asChild variant="outline">
          <Link href="/products">{t("browseAll")}</Link>
        </Button>
      }
    />
  );
}
