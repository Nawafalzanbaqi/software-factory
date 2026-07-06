"use client";

import { useTranslations } from "next-intl";
import { ShoppingCart } from "lucide-react";
import { Link } from "@/lib/i18n/navigation";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { useCart } from "../hooks/useCart";
import { CartLineItem } from "./CartLineItem";
import { CartSummary } from "./CartSummary";

/**
 * Interactive cart page body. Reads the client store; renders an empty state or
 * the line-item list + summary grid. `continueHref` is resolved by the PAGE from
 * the active vertical (restaurant browses /menu, ecommerce /products) — the cart
 * is shared foundation and must not hardcode an ecommerce route.
 */
export function CartView({ continueHref = "/products" }: { continueHref?: string }) {
  const t = useTranslations("cart");
  const { lines, count } = useCart();

  if (count === 0) {
    return (
      <EmptyState
        icon={<ShoppingCart className="size-6" />}
        message={t("empty")}
        className="py-20"
        action={
          <Button asChild>
            <Link href={continueHref}>{t("continueShopping")}</Link>
          </Button>
        }
      />
    );
  }

  return (
    <div className="grid items-start gap-8 lg:grid-cols-[1fr_360px]">
      <ul className="divide-y rounded-2xl border bg-card px-4 shadow-premium sm:px-6">
        {lines.map((line) => (
          <CartLineItem key={line.productId} line={line} />
        ))}
      </ul>
      <CartSummary />
    </div>
  );
}
