"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import type { UseFormRegisterReturn } from "react-hook-form";
import { cn } from "@/lib/utils";
import { FULFILLMENT_TYPES } from "../types";

/**
 * Interactive leaf: the fulfillment-type radio group (dine-in | pickup | delivery).
 * Built on NATIVE radio inputs for accessibility (keyboard arrow navigation, group
 * semantics, screen-reader support). react-hook-form's register() returns a shared
 * name/onChange/onBlur/ref for the whole group, which we spread onto every radio so
 * the group behaves as one field.
 */
export function FulfillmentTypeField({
  registration,
  error,
}: {
  registration: UseFormRegisterReturn;
  error?: string;
}) {
  const t = useTranslations("restaurantCheckout");

  return (
    <fieldset className="space-y-3">
      <legend
        id="fulfillment-label"
        className="font-display text-lg font-semibold"
      >
        {t("form.fulfillmentHeading")}
      </legend>
      <div
        role="radiogroup"
        aria-labelledby="fulfillment-label"
        aria-describedby={error ? "fulfillment-error" : undefined}
        aria-invalid={error ? true : undefined}
        className="grid gap-3 sm:grid-cols-3"
      >
        {FULFILLMENT_TYPES.map((type) => (
          <label
            key={type}
            htmlFor={`fulfillment-${type}`}
            className={cn(
              "relative flex cursor-pointer items-start gap-3 rounded-md border border-input bg-background p-4 shadow-sm transition-colors hover:bg-accent/40",
              "focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 focus-within:ring-offset-background",
              "has-[:checked]:border-primary has-[:checked]:ring-1 has-[:checked]:ring-primary",
            )}
          >
            <input
              id={`fulfillment-${type}`}
              type="radio"
              value={type}
              className="mt-0.5 size-4 shrink-0 accent-primary"
              {...registration}
            />
            <span className="flex flex-col gap-0.5">
              <span className="text-sm font-medium leading-none">
                {t(`form.fulfillment.${type}.label`)}
              </span>
              <span className="text-sm text-muted-foreground">
                {t(`form.fulfillment.${type}.description`)}
              </span>
            </span>
          </label>
        ))}
      </div>
      {error ? (
        <p id="fulfillment-error" role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}
    </fieldset>
  );
}
