"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Check, ShoppingCart } from "lucide-react";
import { Button, type ButtonProps } from "@/components/ui/button";
import { toast } from "@/components/ui/sonner";
import { useCart } from "../hooks/useCart";
import type { AddToCartInput } from "../types";

interface AddToCartButtonProps extends Omit<ButtonProps, "onClick"> {
  product: AddToCartInput;
  quantity?: number;
  inStock?: boolean;
}

/**
 * Interactive leaf: adds a product to the client cart with optimistic feedback.
 * Lives in the cart feature (owns the store) but is used by the products feature.
 */
export function AddToCartButton({
  product,
  quantity = 1,
  inStock = true,
  className,
  size = "lg",
  ...props
}: AddToCartButtonProps) {
  const t = useTranslations("products");
  const { add } = useCart();
  const [done, setDone] = useState(false);

  function handleAdd() {
    add(product, quantity);
    toast.success(t("added"));
    setDone(true);
    setTimeout(() => setDone(false), 1500);
  }

  return (
    <Button
      type="button"
      size={size}
      className={className}
      onClick={handleAdd}
      disabled={!inStock}
      {...props}
    >
      {done ? (
        <Check className="size-4" aria-hidden="true" />
      ) : (
        <ShoppingCart className="size-4" aria-hidden="true" />
      )}
      <span>{inStock ? t("addToCart") : t("outOfStock")}</span>
    </Button>
  );
}
