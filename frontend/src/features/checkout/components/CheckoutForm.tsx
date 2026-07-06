"use client";

import { useTranslations } from "next-intl";
import { MapPin, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { useCheckoutForm } from "../hooks/useCheckoutForm";
import { CHECKOUT_COUNTRIES } from "../types";
import { PaymentMethodField } from "./PaymentMethodField";
import { Select } from "./Select";

/** Gold icon chip (shared .icon-chip) before each checkout section heading. */
function SectionIcon({ Icon }: { Icon: typeof UserRound }) {
  return (
    <span aria-hidden="true" className="icon-chip size-8">
      <Icon className="size-4" />
    </span>
  );
}

/**
 * Interactive leaf: the checkout form. All logic lives in useCheckoutForm; this
 * component is presentation only. Every label/placeholder/error is i18n-driven,
 * fields expose aria-invalid + aria-describedby, errors use role="alert" so screen
 * readers announce them, and native validation is disabled (noValidate) in favour
 * of zod so messages stay localized and consistent.
 */
export function CheckoutForm({
  paymentMethods,
}: {
  paymentMethods: readonly string[];
}) {
  const t = useTranslations("checkout");
  const { form, onSubmit } = useCheckoutForm(paymentMethods);
  const {
    register,
    formState: { errors, isSubmitting },
  } = form;

  return (
    <form noValidate onSubmit={onSubmit} className="space-y-8">
      {/* Contact details */}
      <Card className="rounded-2xl ring-1 ring-border/60">
        <CardContent className="space-y-5 p-6">
          <div className="flex items-center gap-3">
            <SectionIcon Icon={UserRound} />
            <h2 className="font-display text-lg font-semibold">
              {t("form.customerHeading")}
            </h2>
          </div>

          <div className="space-y-2">
            <Label htmlFor="checkout-name">{t("form.name")}</Label>
            <Input
              id="checkout-name"
              autoComplete="name"
              placeholder={t("form.namePlaceholder")}
              aria-invalid={errors.customer?.name ? true : undefined}
              aria-describedby={errors.customer?.name ? "checkout-name-error" : undefined}
              {...register("customer.name")}
            />
            {errors.customer?.name?.message && (
              <p id="checkout-name-error" role="alert" className="text-sm text-destructive">
                {errors.customer.name.message}
              </p>
            )}
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="checkout-email">{t("form.email")}</Label>
              <Input
                id="checkout-email"
                type="email"
                inputMode="email"
                autoComplete="email"
                placeholder={t("form.emailPlaceholder")}
                aria-invalid={errors.customer?.email ? true : undefined}
                aria-describedby={errors.customer?.email ? "checkout-email-error" : undefined}
                {...register("customer.email")}
              />
              {errors.customer?.email?.message && (
                <p id="checkout-email-error" role="alert" className="text-sm text-destructive">
                  {errors.customer.email.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="checkout-phone">{t("form.phone")}</Label>
              <Input
                id="checkout-phone"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                placeholder={t("form.phonePlaceholder")}
                aria-invalid={errors.customer?.phone ? true : undefined}
                aria-describedby={errors.customer?.phone ? "checkout-phone-error" : undefined}
                {...register("customer.phone")}
              />
              {errors.customer?.phone?.message && (
                <p id="checkout-phone-error" role="alert" className="text-sm text-destructive">
                  {errors.customer.phone.message}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Shipping address */}
      <Card className="rounded-2xl ring-1 ring-border/60">
        <CardContent className="space-y-5 p-6">
          <div className="flex items-center gap-3">
            <SectionIcon Icon={MapPin} />
            <h2 className="font-display text-lg font-semibold">
              {t("form.shippingHeading")}
            </h2>
          </div>

          <div className="space-y-2">
            <Label htmlFor="checkout-line1">{t("form.line1")}</Label>
            <Input
              id="checkout-line1"
              autoComplete="address-line1"
              placeholder={t("form.line1Placeholder")}
              aria-invalid={errors.shippingAddress?.line1 ? true : undefined}
              aria-describedby={
                errors.shippingAddress?.line1 ? "checkout-line1-error" : undefined
              }
              {...register("shippingAddress.line1")}
            />
            {errors.shippingAddress?.line1?.message && (
              <p id="checkout-line1-error" role="alert" className="text-sm text-destructive">
                {errors.shippingAddress.line1.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="checkout-line2">
              {t("form.line2")}{" "}
              <span className="text-muted-foreground">({t("form.optional")})</span>
            </Label>
            <Input
              id="checkout-line2"
              autoComplete="address-line2"
              placeholder={t("form.line2Placeholder")}
              aria-invalid={errors.shippingAddress?.line2 ? true : undefined}
              aria-describedby={
                errors.shippingAddress?.line2 ? "checkout-line2-error" : undefined
              }
              {...register("shippingAddress.line2")}
            />
            {errors.shippingAddress?.line2?.message && (
              <p id="checkout-line2-error" role="alert" className="text-sm text-destructive">
                {errors.shippingAddress.line2.message}
              </p>
            )}
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="checkout-city">{t("form.city")}</Label>
              <Input
                id="checkout-city"
                autoComplete="address-level2"
                placeholder={t("form.cityPlaceholder")}
                aria-invalid={errors.shippingAddress?.city ? true : undefined}
                aria-describedby={
                  errors.shippingAddress?.city ? "checkout-city-error" : undefined
                }
                {...register("shippingAddress.city")}
              />
              {errors.shippingAddress?.city?.message && (
                <p id="checkout-city-error" role="alert" className="text-sm text-destructive">
                  {errors.shippingAddress.city.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="checkout-postal">
                {t("form.postalCode")}{" "}
                <span className="text-muted-foreground">({t("form.optional")})</span>
              </Label>
              <Input
                id="checkout-postal"
                inputMode="numeric"
                autoComplete="postal-code"
                placeholder={t("form.postalCodePlaceholder")}
                aria-invalid={errors.shippingAddress?.postalCode ? true : undefined}
                aria-describedby={
                  errors.shippingAddress?.postalCode ? "checkout-postal-error" : undefined
                }
                {...register("shippingAddress.postalCode")}
              />
              {errors.shippingAddress?.postalCode?.message && (
                <p id="checkout-postal-error" role="alert" className="text-sm text-destructive">
                  {errors.shippingAddress.postalCode.message}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="checkout-country">{t("form.country")}</Label>
            <Select
              id="checkout-country"
              autoComplete="country"
              aria-invalid={errors.shippingAddress?.country ? true : undefined}
              aria-describedby={
                errors.shippingAddress?.country ? "checkout-country-error" : undefined
              }
              {...register("shippingAddress.country")}
            >
              {CHECKOUT_COUNTRIES.map((code) => (
                <option key={code} value={code}>
                  {t(`form.countries.${code}`)}
                </option>
              ))}
            </Select>
            {errors.shippingAddress?.country?.message && (
              <p id="checkout-country-error" role="alert" className="text-sm text-destructive">
                {errors.shippingAddress.country.message}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Payment method */}
      <Card className="rounded-2xl ring-1 ring-border/60">
        <CardContent className="p-6">
          <PaymentMethodField
            methods={paymentMethods}
            registration={register("paymentMethod")}
            error={errors.paymentMethod?.message}
          />
        </CardContent>
      </Card>

      <Button
        type="submit"
        size="lg"
        className="w-full sm:w-auto"
        disabled={isSubmitting}
        aria-busy={isSubmitting}
      >
        {isSubmitting ? t("form.placing") : t("form.placeOrder")}
      </Button>
    </form>
  );
}
