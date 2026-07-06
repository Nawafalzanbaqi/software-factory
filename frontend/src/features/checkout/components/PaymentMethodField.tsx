"use client";

import { useTranslations } from "next-intl";
import { CreditCard } from "lucide-react";
import type { UseFormRegisterReturn } from "react-hook-form";
import { RadioGroup, RadioGroupItem } from "./RadioGroup";

/**
 * Interactive leaf: the payment-method radio group. Built from the configured
 * methods (options.json `payments` + cod). react-hook-form's register() returns a
 * shared name/onChange/onBlur/ref for the whole group, which we spread onto every
 * native radio — so the group behaves as one field.
 *
 * TODO (backlog): integrate Tamara/Tabi widget + capture. These render only as
 * selectable methods here; the hosted widget + payment capture are out of scope.
 */
export function PaymentMethodField({
  methods,
  registration,
  error,
}: {
  methods: readonly string[];
  registration: UseFormRegisterReturn;
  error?: string;
}) {
  const t = useTranslations("checkout");

  return (
    <fieldset className="space-y-3">
      {/* legend itself stays display-default (WebKit ignores flex on legend —
          flexbugs #9); the inner span carries the flex layout. */}
      <legend id="checkout-payment-label" className="font-display text-lg font-semibold">
        <span className="flex items-center gap-3">
          <span aria-hidden="true" className="icon-chip size-8">
            <CreditCard className="size-4" />
          </span>
          {t("form.paymentHeading")}
        </span>
      </legend>
      <RadioGroup
        aria-labelledby="checkout-payment-label"
        aria-describedby={error ? "checkout-payment-error" : undefined}
      >
        {methods.map((method) => (
          <RadioGroupItem
            key={method}
            id={`payment-${method}`}
            value={method}
            label={t(`payment.methods.${method}.label`)}
            description={t(`payment.methods.${method}.description`)}
            aria-invalid={error ? true : undefined}
            {...registration}
          />
        ))}
      </RadioGroup>
      {error ? (
        <p id="checkout-payment-error" role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}
    </fieldset>
  );
}
