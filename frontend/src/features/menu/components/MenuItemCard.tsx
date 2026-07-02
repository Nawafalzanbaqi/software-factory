import Image from "next/image";
import { getLocale, getTranslations } from "next-intl/server";
import { Flame } from "lucide-react";
import { Link } from "@/lib/i18n/navigation";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { formatPrice } from "@/lib/utils";
import type { Locale } from "@/lib/i18n/routing";
import type { MenuItemDto } from "../types";
import { localizeMenuItem } from "../types";

/**
 * Server Component menu item card. Presentational only; the interactive add-to-cart
 * lives on the detail page (keeps the grid a pure server render for performance).
 */
export async function MenuItemCard({ item }: { item: MenuItemDto }) {
  const locale = (await getLocale()) as Locale;
  const t = await getTranslations("menu");
  const { name, description } = localizeMenuItem(item, locale);
  const image = item.images[0] ?? "/placeholder.svg";
  const spicy = item.spicyLevel != null && item.spicyLevel > 0;

  return (
    <Card className="group relative flex h-full flex-col overflow-hidden transition-shadow hover:shadow-premium">
      <Link href={`/menu/${item.slug}`} className="flex h-full flex-col">
        <div className="relative aspect-[4/3] overflow-hidden bg-muted">
          <Image
            src={image}
            alt={name}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
          {spicy && (
            <Badge variant="accent" className="absolute start-3 top-3 gap-1">
              <Flame className="size-3.5" aria-hidden="true" />
              <span className="sr-only">{t("spicy")}</span>
              <span aria-hidden="true">{"🌶".repeat(Math.min(item.spicyLevel!, 3))}</span>
            </Badge>
          )}
          {!item.isAvailable && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/60">
              <Badge variant="secondary">{t("unavailable")}</Badge>
            </div>
          )}
        </div>
        <CardContent className="flex flex-1 flex-col gap-2 p-4">
          <div className="flex items-start justify-between gap-3">
            <h3 className="line-clamp-1 font-medium">{name}</h3>
            <span className="shrink-0 font-semibold tabular-nums">
              {formatPrice(item.price, item.currency, locale)}
            </span>
          </div>
          <p className="line-clamp-2 text-sm text-muted-foreground">{description}</p>
          {item.calories != null && (
            <p className="mt-auto text-xs text-muted-foreground">
              {t("calories", { count: item.calories })}
            </p>
          )}
        </CardContent>
      </Link>
    </Card>
  );
}
