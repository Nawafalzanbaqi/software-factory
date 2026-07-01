"use client";

import { useState } from "react";
import Image from "next/image";
import { useLocale } from "next-intl";
import { Link } from "@/lib/i18n/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { formatPrice } from "@/lib/utils";
import type { Locale } from "@/lib/i18n/routing";
import type { ProductDto } from "@/lib/api/types";
import { localizeProduct } from "../types";
import { WishlistButton } from "./WishlistButton";

/**
 * A wishlist entry: product visual + a heart toggle to remove it. Client
 * Component so removal is optimistic — on a successful remove the card hides
 * itself immediately (no full-page refresh needed).
 */
export function WishlistItemCard({ product }: { product: ProductDto }) {
  const locale = useLocale() as Locale;
  const [removed, setRemoved] = useState(false);
  const { name } = localizeProduct(product, locale);
  const image = product.images[0] ?? "/placeholder.svg";

  if (removed) return null;

  return (
    <div className="relative">
      <WishlistButton
        productId={product.id}
        initialInWishlist
        onChange={(inWishlist) => {
          if (!inWishlist) setRemoved(true);
        }}
        className="absolute end-3 top-3 z-10 shadow-sm"
      />
      <Card className="group overflow-hidden transition-shadow hover:shadow-premium">
        <Link href={`/products/${product.slug}`} className="block">
          <div className="relative aspect-square overflow-hidden bg-muted">
            <Image
              src={image}
              alt={name}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              className="object-cover transition-transform duration-300 group-hover:scale-105"
            />
          </div>
          <CardContent className="space-y-1 p-4">
            <h3 className="line-clamp-1 font-medium">{name}</h3>
            <span className="font-semibold tabular-nums">
              {formatPrice(product.price, product.currency, locale)}
            </span>
          </CardContent>
        </Link>
      </Card>
    </div>
  );
}
