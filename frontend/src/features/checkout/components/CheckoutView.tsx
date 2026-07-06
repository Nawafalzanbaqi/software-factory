"use client";

import { useTranslations } from "next-intl";
import { ShoppingBag } from "lucide-react";
import { Link } from "@/lib/i18n/navigation";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
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
      <EmptyState
        icon={<ShoppingBag className="size-6" />}
        message={t("empty")}
        className="py-20"
        action={
          <Button asChild>
            <Link href="/products">{t("continueShopping")}</Link>
          </Button>
        }
      />
    );
  }

  return (
    <div className="grid items-start gap-8 lg:grid-cols-[1fr_360px]">
      <CheckoutForm paymentMethods={paymentMethods} />
      <CheckoutSummary />
    </div>
  );
}
