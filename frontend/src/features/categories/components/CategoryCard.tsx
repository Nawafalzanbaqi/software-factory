import Image from "next/image";
import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/lib/i18n/navigation";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import type { Locale } from "@/lib/i18n/routing";
import type { CategoryDto } from "@/lib/api/types";
import { localizeCategory } from "../types";

/**
 * Server Component category card. Presentational only — links to the filtered
 * product listing (/products?category=<slug>) via the locale-aware Link so the
 * grid stays a pure server render for performance.
 */
export async function CategoryCard({ category }: { category: CategoryDto }) {
  const locale = (await getLocale()) as Locale;
  const t = await getTranslations("categories");
  const { name } = localizeCategory(category, locale);
  const image = category.imageUrl ?? "/placeholder.svg";

  // TODO (backlog): fire a "select_category" analytics event on click once the
  // analytics layer (options.features.analytics) is wired — keep this card a
  // pure Server Component until then.

  return (
    <Card className="group overflow-hidden transition-shadow hover:shadow-premium">
      <Link
        href={`/products?category=${encodeURIComponent(category.slug)}`}
        aria-label={t("browseAria", { name })}
        className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      >
        <div className="relative aspect-[4/3] overflow-hidden bg-muted">
          <Image
            src={image}
            alt={name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        </div>
        <CardContent className="flex items-center justify-between gap-2 p-4">
          <h3 className="line-clamp-1 font-medium">{name}</h3>
          <Badge variant="secondary" className="shrink-0 tabular-nums">
            {t("productCount", { count: category.productCount })}
          </Badge>
        </CardContent>
      </Link>
    </Card>
  );
}
