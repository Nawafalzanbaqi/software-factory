import Image from "next/image";
import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/lib/i18n/navigation";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { formatPrice } from "@/lib/utils";
import { isFeatureEnabled } from "@/lib/config/options";
import { WishlistButton } from "@/features/wishlist";
import type { Locale } from "@/lib/i18n/routing";
import type { ProductDto } from "@/lib/api/types";
import { localizeProduct } from "../types";

/**
 * Server Component product card. Presentational only; the interactive add-to-cart
 * lives on the detail page (keeps the grid a pure server render for performance).
 */
export async function ProductCard({ product }: { product: ProductDto }) {
  const locale = (await getLocale()) as Locale;
  const t = await getTranslations("products");
  const { name } = localizeProduct(product, locale);
  const onSale =
    product.compareAtPrice != null && product.compareAtPrice > product.price;
  const image = product.images[0] ?? "/placeholder.svg";
  const wishlistEnabled = await isFeatureEnabled("wishlist");

  return (
    <Card className="group relative overflow-hidden transition-shadow hover:shadow-premium">
      {wishlistEnabled && (
        <WishlistButton
          productId={product.id}
          className="absolute end-3 top-3 z-10 shadow-sm"
        />
      )}
      <Link href={`/products/${product.slug}`} className="block">
        <div className="relative aspect-square overflow-hidden bg-muted">
          <Image
            src={image}
            alt={name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
          {onSale && (
            <Badge variant="accent" className="absolute start-3 top-3">
              {t("compareAt")}
            </Badge>
          )}
          {!product.inStock && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/60">
              <Badge variant="secondary">{t("outOfStock")}</Badge>
            </div>
          )}
        </div>
        <CardContent className="space-y-1 p-4">
          <h3 className="line-clamp-1 font-medium">{name}</h3>
          <div className="flex items-baseline gap-2">
            <span className="font-semibold tabular-nums">
              {formatPrice(product.price, product.currency, locale)}
            </span>
            {onSale && (
              <span className="text-sm text-muted-foreground line-through tabular-nums">
                {formatPrice(product.compareAtPrice!, product.currency, locale)}
              </span>
            )}
          </div>
        </CardContent>
      </Link>
    </Card>
  );
}
