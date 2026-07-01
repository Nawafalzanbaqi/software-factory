"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { AddToCartButton, QuantityStepper, type AddToCartInput } from "@/features/cart";

/**
 * Interactive leaf: quantity stepper + add-to-cart for the detail page. Keeps the
 * detail page a Server Component while isolating the small client island.
 */
export function ProductPurchasePanel({
  product,
  inStock,
}: {
  product: AddToCartInput;
  inStock: boolean;
}) {
  const t = useTranslations("products");
  const [quantity, setQuantity] = useState(1);

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="flex flex-col gap-1">
        <span className="text-sm text-muted-foreground">{t("quantity")}</span>
        <QuantityStepper value={quantity} onChange={setQuantity} />
      </div>
      <AddToCartButton
        product={product}
        quantity={quantity}
        inStock={inStock}
        className="min-w-48 flex-1"
      />
    </div>
  );
}
