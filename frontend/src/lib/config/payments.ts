/**
 * Payment-method resolution shared across features (checkout renders the
 * selector; the product detail page shows availability chips). Lives in lib/
 * because features must not import each other — both consume this instead.
 *
 * `tamara`/`tabi` come from options.json `payments`; `cod` (cash on delivery)
 * is always offered as a fallback. Only methods in this set have i18n copy
 * under `checkout.payment.methods.*`.
 */
export const CHECKOUT_PAYMENT_METHODS = ["tamara", "tabi", "cod"] as const;
export type CheckoutPaymentMethod = (typeof CHECKOUT_PAYMENT_METHODS)[number];

/**
 * Resolve the ordered list of selectable payment methods from the configured
 * options.json `payments`: keep the supported/known ones in their configured
 * order (deduped), then always append cash-on-delivery as a fallback.
 */
export function resolvePaymentMethods(
  configured: readonly string[],
): CheckoutPaymentMethod[] {
  const supported = new Set<string>(CHECKOUT_PAYMENT_METHODS);
  const ordered: CheckoutPaymentMethod[] = [];
  for (const method of configured) {
    if (supported.has(method) && !ordered.includes(method as CheckoutPaymentMethod)) {
      ordered.push(method as CheckoutPaymentMethod);
    }
  }
  if (!ordered.includes("cod")) ordered.push("cod");
  return ordered;
}
