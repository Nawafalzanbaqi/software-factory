"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Check, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/sonner";
import { useCart, QuantityStepper, type AddToCartInput } from "@/features/cart";

/**
 * Interactive client leaf for the menu item detail page: quantity stepper +
 * add-to-cart. Reuses the SHARED cart (`useCart` from @/features/cart) — `add`
 * stores the line with `productId = item.id` (the generic catalog-item id, a
 * MenuItem id here per PHASE2 wire-compat rule). Keeps the detail page a Server
 * Component while isolating this small client island.
 */
export function MenuAddToCart({
  item,
  available,
}: {
  item: AddToCartInput;
  available: boolean;
}) {
  const t = useTranslations("menu");
  const { add } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [done, setDone] = useState(false);

  function handleAdd() {
    // useCart.add maps to a cart line keyed by { productId: item.id, quantity }.
    add(item, quantity);
    toast.success(t("added"));
    setDone(true);
    setTimeout(() => setDone(false), 1500);
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="flex flex-col gap-1">
        <span className="text-sm text-muted-foreground">{t("quantity")}</span>
        <QuantityStepper value={quantity} onChange={setQuantity} />
      </div>
      <Button
        type="button"
        size="lg"
        className="min-w-48 flex-1"
        onClick={handleAdd}
        disabled={!available}
      >
        {done ? (
          <Check className="size-4" aria-hidden="true" />
        ) : (
          <ShoppingCart className="size-4" aria-hidden="true" />
        )}
        <span>{available ? t("addToCart") : t("unavailable")}</span>
      </Button>
    </div>
  );
}
