import { getTranslations } from "next-intl/server";
import { Search, SearchX } from "lucide-react";
import { Link } from "@/lib/i18n/navigation";
import { Button } from "@/components/ui/button";

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
    <div className="flex flex-col items-center justify-center gap-4 rounded-lg border border-dashed py-16 text-center">
      <Icon className="size-10 text-muted-foreground" aria-hidden="true" />
      <p className="text-muted-foreground">
        {isPrompt ? t("prompt") : t("noResults", { query: query ?? "" })}
      </p>
      <Button asChild variant="outline">
        <Link href="/products">{t("browseAll")}</Link>
      </Button>
    </div>
  );
}
