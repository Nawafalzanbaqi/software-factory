"use client";

import { useTranslations } from "next-intl";
import { ShoppingCart } from "lucide-react";
import { Link } from "@/lib/i18n/navigation";
import { Button } from "@/components/ui/button";
import { useCart } from "../hooks/useCart";
import { CartLineItem } from "./CartLineItem";
import { CartSummary } from "./CartSummary";

/**
 * Interactive cart page body. Reads the client store; renders an empty state or
 * the line-item list + summary grid.
 */
export function CartView() {
  const t = useTranslations("cart");
  const { lines, count } = useCart();

  if (count === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 rounded-lg border border-dashed py-20 text-center">
        <ShoppingCart className="size-10 text-muted-foreground" aria-hidden="true" />
        <p className="text-muted-foreground">{t("empty")}</p>
        <Button asChild>
          <Link href="/products">{t("continueShopping")}</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
      <ul className="divide-y">
        {lines.map((line) => (
          <CartLineItem key={line.productId} line={line} />
        ))}
      </ul>
      <CartSummary />
    </div>
  );
}
