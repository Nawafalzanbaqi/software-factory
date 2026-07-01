"use client";

import { useTranslations } from "next-intl";
import { ShoppingBag } from "lucide-react";
import { Link } from "@/lib/i18n/navigation";
import { Button } from "@/components/ui/button";
import { useCart } from "@/features/cart";
import { CheckoutForm } from "./CheckoutForm";
import { CheckoutSummary } from "./CheckoutSummary";

/**
 * Interactive checkout page body. Reads the client cart: renders an empty state
 * when there is nothing to check out, otherwise the form + order summary grid.
 * `paymentMethods` is resolved on the server (options.json) and passed down.
 */
export function CheckoutView({
  paymentMethods,
}: {
  paymentMethods: readonly string[];
}) {
  const t = useTranslations("checkout");
  const { count } = useCart();

  if (count === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 rounded-lg border border-dashed py-20 text-center">
        <ShoppingBag className="size-10 text-muted-foreground" aria-hidden="true" />
        <p className="text-muted-foreground">{t("empty")}</p>
        <Button asChild>
          <Link href="/products">{t("continueShopping")}</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
      <CheckoutForm paymentMethods={paymentMethods} />
      <CheckoutSummary />
    </div>
  );
}
