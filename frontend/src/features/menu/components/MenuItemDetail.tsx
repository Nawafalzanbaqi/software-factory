import Image from "next/image";
import { getLocale, getTranslations } from "next-intl/server";
import { Flame } from "lucide-react";
import { Link } from "@/lib/i18n/navigation";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { formatPrice } from "@/lib/utils";
import type { Locale } from "@/lib/i18n/routing";
import type { MenuItemDto } from "../types";
import { localizeMenuItem } from "../types";
import { MenuAddToCart } from "./MenuAddToCart";

/**
 * Server Component menu item detail. Static content (gallery, copy, price) renders
 * on the server; the quantity + add-to-cart controls are an interactive client leaf
 * (MenuAddToCart) that reuses the shared cart.
 */
export async function MenuItemDetail({ item }: { item: MenuItemDto }) {
  const locale = (await getLocale()) as Locale;
  const t = await getTranslations("menu");
  const { name, description } = localizeMenuItem(item, locale);
  const hero = item.images[0] ?? "/placeholder.svg";
  const spicy = item.spicyLevel != null && item.spicyLevel > 0;

  return (
    <article className="grid gap-8 lg:grid-cols-2">
      <div className="space-y-4">
        <div className="relative aspect-[4/3] overflow-hidden rounded-lg border bg-muted">
          <Image
            src={hero}
            alt={name}
            fill
            priority
            sizes="(max-width: 1024px) 100vw, 50vw"
            className="object-cover"
          />
        </div>
        {item.images.length > 1 && (
          <ul className="grid grid-cols-4 gap-3">
            {item.images.slice(0, 4).map((src, i) => (
              <li
                key={src}
                className="relative aspect-square overflow-hidden rounded-md border bg-muted"
              >
                <Image
                  src={src}
                  alt={`${name} ${i + 1}`}
                  fill
                  sizes="120px"
                  className="object-cover"
                />
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="space-y-6">
        <div className="space-y-2">
          <Link
            href="/menu"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            ← {t("backToMenu")}
          </Link>
          <h1 className="font-display text-3xl font-semibold">{name}</h1>
          <div className="flex flex-wrap items-center gap-3">
            <Badge variant={item.isAvailable ? "secondary" : "outline"}>
              {item.isAvailable ? t("available") : t("unavailable")}
            </Badge>
            {spicy && (
              <span className="inline-flex items-center gap-1 text-sm text-muted-foreground">
                <Flame className="size-4 text-accent" aria-hidden="true" />
                {t("spicyLevel", { level: item.spicyLevel! })}
              </span>
            )}
            {item.calories != null && (
              <span className="text-sm text-muted-foreground">
                {t("calories", { count: item.calories })}
              </span>
            )}
          </div>
        </div>

        <div className="text-2xl font-semibold tabular-nums">
          {formatPrice(item.price, item.currency, locale)}
        </div>

        <MenuAddToCart
          item={{
            id: item.id,
            slug: item.slug,
            nameEn: item.nameEn,
            nameAr: item.nameAr,
            price: item.price,
            currency: item.currency,
            imageUrl: hero,
          }}
          available={item.isAvailable}
        />

        {/* TODO(phase-3): loyalty points / real payment estimates on menu items. */}

        <Separator />

        <div className="space-y-2">
          <h2 className="font-medium">{t("description")}</h2>
          <p className="text-sm leading-relaxed text-muted-foreground">{description}</p>
        </div>

        {item.tags.length > 0 && (
          <ul className="flex flex-wrap gap-2" aria-label={t("tags")}>
            {item.tags.map((tag) => (
              <li key={tag}>
                <Badge variant="outline">{tag}</Badge>
              </li>
            ))}
          </ul>
        )}
      </div>
    </article>
  );
}
