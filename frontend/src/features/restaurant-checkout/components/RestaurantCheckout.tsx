"use client";

import { useTranslations } from "next-intl";
import { ShoppingBag } from "lucide-react";
import { Link } from "@/lib/i18n/navigation";
import { Button } from "@/components/ui/button";
import { useCart } from "@/features/cart";
import { useBranches } from "../hooks/useBranches";
import { RestaurantCheckoutForm } from "./RestaurantCheckoutForm";
import { RestaurantOrderSummary } from "./RestaurantOrderSummary";

/**
 * Interactive restaurant checkout body (dine-in / pickup / delivery). Reads the
 * shared client cart: renders an empty state when there is nothing to order,
 * otherwise the food-order form + order summary grid.
 *
 * MOUNTING: this component has no page of its own — the integrator mounts it on
 * /checkout when getSiteType() === "restaurant" (the ecommerce CheckoutView is
 * mounted otherwise). It fetches its own branch list client-side.
 *
 * @param paymentMethod optional server-resolved payment method from
 *   options.restaurant.json `payments` (defaults to cash/pay-at-venue).
 * TODO(phase-3): integrate real payment capture.
 */
export function RestaurantCheckout({
  paymentMethod,
}: {
  paymentMethod?: string;
}) {
  const t = useTranslations("restaurantCheckout");
  const { count } = useCart();
  const { branches, isLoading, isError } = useBranches();

  if (count === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 rounded-lg border border-dashed py-20 text-center">
        <ShoppingBag className="size-10 text-muted-foreground" aria-hidden="true" />
        <p className="text-muted-foreground">{t("empty")}</p>
        <Button asChild>
          <Link href="/menu">{t("browseMenu")}</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
      <RestaurantCheckoutForm
        branches={branches}
        branchesLoading={isLoading}
        branchesError={isError}
        paymentMethod={paymentMethod}
      />
      <RestaurantOrderSummary />
    </div>
  );
}
