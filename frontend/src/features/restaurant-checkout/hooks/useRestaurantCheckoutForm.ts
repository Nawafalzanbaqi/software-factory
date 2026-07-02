"use client";

import { useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { toast } from "@/components/ui/sonner";
import { useRouter } from "@/lib/i18n/navigation";
import { useCart } from "@/features/cart";
import { restaurantCheckoutApi } from "../api/restaurantCheckoutApi";
import {
  restaurantCheckoutFormSchema,
  DEFAULT_FULFILLMENT_TYPE,
  DEFAULT_PAYMENT_METHOD,
  type PlaceFoodOrderRequest,
  type RestaurantCheckoutFormValues,
} from "../types";

const GUEST_CART_ID_KEY = "sf-cart-id";

/**
 * The Phase-1 cart lives client-side (see features/cart/hooks/useCart) and has no
 * server cart id, but POST /checkout requires a `cartId`. We lazily generate and
 * persist a stable guest cart id (shared key with the ecommerce checkout) so repeat
 * checkouts reuse the same identifier.
 *
 * TODO(phase-3): replace with the server cart id once guest carts are synced to the
 * backend (shared /cart endpoints).
 */
function getOrCreateGuestCartId(): string {
  try {
    const existing = window.localStorage.getItem(GUEST_CART_ID_KEY);
    if (existing) return existing;
    const id = crypto.randomUUID();
    window.localStorage.setItem(GUEST_CART_ID_KEY, id);
    return id;
  } catch {
    return crypto.randomUUID();
  }
}

/**
 * Encapsulates the restaurant checkout form logic: react-hook-form + zod validation
 * with i18n error messages, food-order creation via the api client, cart clearing
 * and a locale-aware redirect to the order tracking page. Keeps the form components
 * thin, presentational client leaves.
 *
 * @param paymentMethod resolved on the server from options.restaurant.json
 *   `payments` (defaults to cash/pay-at-venue). Payment capture is out of scope.
 */
export function useRestaurantCheckoutForm(
  paymentMethod: string = DEFAULT_PAYMENT_METHOD,
) {
  const t = useTranslations("restaurantCheckout");
  const router = useRouter();
  const { clear } = useCart();

  // Rebuild the schema when the translator changes so validation messages stay
  // localized (keys resolve under the "restaurantCheckout" namespace).
  const schema = useMemo(() => restaurantCheckoutFormSchema(t), [t]);

  const form = useForm<RestaurantCheckoutFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      fulfillmentType: DEFAULT_FULFILLMENT_TYPE,
      branchId: "",
      tableId: "",
      scheduledFor: "",
      customer: { name: "", email: "", phone: "" },
      deliveryAddress: { line1: "", line2: "", city: "" },
    },
    mode: "onBlur",
  });

  const onSubmit = form.handleSubmit(async (values) => {
    // TODO(phase-3): integrate real payment capture. Every method (currently only
    // cash/pay-at-venue) just creates the order; the tracking page owns next steps.
    try {
      const isDineIn = values.fulfillmentType === "dinein";
      const isDelivery = values.fulfillmentType === "delivery";

      const payload: PlaceFoodOrderRequest = {
        cartId: getOrCreateGuestCartId(),
        customer: {
          name: values.customer.name,
          email: values.customer.email,
          phone: values.customer.phone,
        },
        fulfillmentType: values.fulfillmentType,
        branchId: values.branchId,
        tableId: isDineIn ? values.tableId || undefined : undefined,
        deliveryAddress: isDelivery
          ? {
              line1: values.deliveryAddress.line1 ?? "",
              line2: values.deliveryAddress.line2 || undefined,
              city: values.deliveryAddress.city ?? "",
            }
          : undefined,
        scheduledFor: values.scheduledFor || undefined,
        paymentMethod,
      };

      const { orderNumber } = await restaurantCheckoutApi.create(payload);
      clear();
      toast.success(t("toast.success"));
      router.push(`/orders/${encodeURIComponent(orderNumber)}`);
    } catch {
      // ApiError (network / non-2xx) — surface a generic, localized failure.
      toast.error(t("toast.error"));
    }
  });

  return { form, onSubmit };
}
