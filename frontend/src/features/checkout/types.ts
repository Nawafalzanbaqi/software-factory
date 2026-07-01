import { z } from "zod";
import type { CheckoutRequest } from "@/lib/api/types";

/**
 * Checkout form model. The POST body type ({@link CheckoutRequest}) is REUSED from
 * src/lib/api/types (ARCHITECTURE.md §2 REST contract) — never redefined here. This
 * file only declares the *form* schema (a superset UI shape) plus the constants
 * that drive the country + payment-method selectors.
 *
 * NOTE on `shippingAddress`: the CheckoutRequest contract exposes
 * { line1, line2?, city, country, postalCode? } — there is no `region` field, so
 * the form intentionally collects line2 (optional) and omits region to honor the
 * "do not invent DTO fields" rule. See index.ts / manifest notes.
 */
export type { CheckoutRequest };

export const NAME_MAX = 80;
export const LINE_MAX = 120;
export const CITY_MAX = 80;
export const POSTAL_MAX = 20;
export const PHONE_MAX = 20;

/** Lenient international/Saudi phone pattern (digits, spaces, dashes, leading +). */
const PHONE_REGEX = /^\+?[0-9][0-9\s-]{6,19}$/;

/** Countries offered in the shipping selector (GCC). Values are ISO 3166-1 alpha-2. */
export const CHECKOUT_COUNTRIES = ["SA", "AE", "KW", "QA", "BH", "OM"] as const;
export type CheckoutCountry = (typeof CHECKOUT_COUNTRIES)[number];
export const DEFAULT_COUNTRY: CheckoutCountry = "SA";

/**
 * Payment methods this feature can render + label. `tamara`/`tabi` come from
 * options.json `payments`; `cod` (cash on delivery) is always offered as a
 * fallback. Only methods in this set have i18n copy under `checkout.payment`.
 */
export const CHECKOUT_PAYMENT_METHODS = ["tamara", "tabi", "cod"] as const;
export type CheckoutPaymentMethod = (typeof CHECKOUT_PAYMENT_METHODS)[number];

/**
 * Resolve the ordered list of selectable payment methods from the configured
 * options.json `payments`: keep the supported/known ones in their configured
 * order, then always append cash-on-delivery as a fallback.
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

/**
 * Zod schema factory for the checkout form. Accepts a translator so validation
 * messages are i18n-driven (keys resolve under the "checkout" namespace) and the
 * list of allowed payment methods so the radio value is validated against config.
 * The parsed output maps 1:1 onto {@link CheckoutRequest} minus the server-side
 * `cartId` (added at submit time).
 */
export function checkoutFormSchema(
  t: (key: string) => string,
  allowedMethods: readonly string[],
) {
  return z.object({
    customer: z.object({
      name: z
        .string()
        .trim()
        .min(1, t("validation.nameRequired"))
        .max(NAME_MAX, t("validation.nameMax")),
      email: z
        .string()
        .trim()
        .min(1, t("validation.emailRequired"))
        .email(t("validation.emailInvalid")),
      phone: z
        .string()
        .trim()
        .min(1, t("validation.phoneRequired"))
        .max(PHONE_MAX, t("validation.phoneInvalid"))
        .regex(PHONE_REGEX, t("validation.phoneInvalid")),
    }),
    shippingAddress: z.object({
      line1: z
        .string()
        .trim()
        .min(1, t("validation.line1Required"))
        .max(LINE_MAX, t("validation.line1Max")),
      // Optional second address line — empty string is allowed.
      line2: z.string().trim().max(LINE_MAX, t("validation.line2Max")),
      city: z
        .string()
        .trim()
        .min(1, t("validation.cityRequired"))
        .max(CITY_MAX, t("validation.cityMax")),
      country: z.string().trim().min(1, t("validation.countryRequired")),
      // Optional postal code — empty string is allowed.
      postalCode: z.string().trim().max(POSTAL_MAX, t("validation.postalMax")),
    }),
    paymentMethod: z
      .string()
      .min(1, t("validation.paymentRequired"))
      .refine((value) => allowedMethods.includes(value), t("validation.paymentRequired")),
  });
}

/** Form values inferred from the schema (parsed/trimmed shape). */
export type CheckoutFormValues = z.infer<ReturnType<typeof checkoutFormSchema>>;
