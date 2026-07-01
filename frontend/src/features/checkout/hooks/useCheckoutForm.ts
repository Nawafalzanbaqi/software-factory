"use client";

import { useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { toast } from "@/components/ui/sonner";
import { useRouter } from "@/lib/i18n/navigation";
import { useCart } from "@/features/cart";
import type { CheckoutRequest } from "@/lib/api/types";
import { checkoutApi } from "../api/checkoutApi";
import {
  checkoutFormSchema,
  DEFAULT_COUNTRY,
  type CheckoutFormValues,
} from "../types";

const GUEST_CART_ID_KEY = "sf-cart-id";

/**
 * The Phase-1 cart lives client-side (see features/cart/hooks/useCart) and has no
 * server cart id, but POST /checkout requires a `cartId`. We lazily generate and
 * persist a stable guest cart id so repeat checkouts reuse the same identifier.
 *
 * TODO (backlog): replace with the server cart id once guest carts are synced to
 * the backend (ARCHITECTURE.md §2 cart endpoints).
 */
function getOrCreateGuestCartId(): string {
  try {
    const existing = window.localStorage.getItem(GUEST_CART_ID_KEY);
    if (existing) return existing;
    const id = crypto.randomUUID();
    window.localStorage.setItem(GUEST_CART_ID_KEY, id);
    return id;
  } catch {
    // Private mode / storage disabled — fall back to an ephemeral id.
    return crypto.randomUUID();
  }
}

/**
 * Encapsulates the checkout form logic: react-hook-form + zod validation with i18n
 * error messages, order creation via the api client, cart clearing and a
 * locale-aware redirect to the order confirmation page. Keeps CheckoutForm a thin,
 * presentational client leaf.
 */
export function useCheckoutForm(paymentMethods: readonly string[]) {
  const t = useTranslations("checkout");
  const router = useRouter();
  const { clear } = useCart();

  // Rebuild the schema when the translator or method list changes so validation
  // messages stay localized and the payment enum matches the configured methods.
  const schema = useMemo(
    () => checkoutFormSchema(t, paymentMethods),
    [t, paymentMethods],
  );

  const form = useForm<CheckoutFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      customer: { name: "", email: "", phone: "" },
      shippingAddress: {
        line1: "",
        line2: "",
        city: "",
        country: DEFAULT_COUNTRY,
        postalCode: "",
      },
      paymentMethod: paymentMethods[0] ?? "",
    },
    mode: "onBlur",
  });

  const onSubmit = form.handleSubmit(async (values) => {
    // TODO (backlog): integrate Tamara/Tabi widget + capture. Payment gateway
    // redirection/capture is out of scope — every method (tamara | tabi | cod)
    // currently just creates the order; the confirmation page owns next steps.
    try {
      const payload: CheckoutRequest = {
        cartId: getOrCreateGuestCartId(),
        customer: {
          name: values.customer.name,
          email: values.customer.email,
          phone: values.customer.phone,
        },
        shippingAddress: {
          line1: values.shippingAddress.line1,
          line2: values.shippingAddress.line2 || undefined,
          city: values.shippingAddress.city,
          country: values.shippingAddress.country,
          postalCode: values.shippingAddress.postalCode || undefined,
        },
        paymentMethod: values.paymentMethod,
      };

      const order = await checkoutApi.create(payload);
      clear();
      toast.success(t("toast.success"));
      router.push(`/orders/${encodeURIComponent(order.orderNumber)}`);
    } catch {
      // ApiError (network / non-2xx) — surface a generic, localized failure.
      // TODO (backlog): map field-level 422 validation errors from the backend
      // onto form fields via form.setError once the error envelope is finalized.
      toast.error(t("toast.error"));
    }
  });

  return { form, onSubmit };
}
