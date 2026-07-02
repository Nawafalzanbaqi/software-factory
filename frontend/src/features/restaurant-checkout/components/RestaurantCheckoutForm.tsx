"use client";

import { useLocale, useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import type { Locale } from "@/lib/i18n/routing";
import { useRestaurantCheckoutForm } from "../hooks/useRestaurantCheckoutForm";
import type { BranchDto } from "../types";
import { FulfillmentTypeField } from "./FulfillmentTypeField";
import { Select } from "./Select";

/**
 * Interactive leaf: the restaurant checkout form. All logic lives in
 * useRestaurantCheckoutForm; this component is presentation only. Every
 * label/placeholder/error is i18n-driven, fields expose aria-invalid +
 * aria-describedby, errors use role="alert" so screen readers announce them, and
 * native validation is disabled (noValidate) in favour of zod so messages stay
 * localized. Conditional fields (table for dine-in, address for delivery) mount
 * based on the selected fulfillment type.
 */
export function RestaurantCheckoutForm({
  branches,
  branchesLoading,
  branchesError,
  paymentMethod,
}: {
  branches: BranchDto[];
  branchesLoading: boolean;
  branchesError: boolean;
  paymentMethod?: string;
}) {
  const t = useTranslations("restaurantCheckout");
  const locale = useLocale() as Locale;
  const { form, onSubmit } = useRestaurantCheckoutForm(paymentMethod);
  const {
    register,
    watch,
    formState: { errors, isSubmitting },
  } = form;

  const fulfillmentType = watch("fulfillmentType");
  const isDineIn = fulfillmentType === "dinein";
  const isDelivery = fulfillmentType === "delivery";
  const canSchedule = fulfillmentType !== "dinein";

  return (
    <form noValidate onSubmit={onSubmit} className="space-y-8">
      {/* Fulfillment type */}
      <Card>
        <CardContent className="p-6">
          <FulfillmentTypeField
            registration={register("fulfillmentType")}
            error={errors.fulfillmentType?.message}
          />
        </CardContent>
      </Card>

      {/* Branch + fulfillment details */}
      <Card>
        <CardContent className="space-y-5 p-6">
          <h2 className="font-display text-lg font-semibold">
            {t("form.branchHeading")}
          </h2>

          <div className="space-y-2">
            <Label htmlFor="rc-branch">{t("form.branch")}</Label>
            <Select
              id="rc-branch"
              disabled={branchesLoading}
              aria-invalid={errors.branchId ? true : undefined}
              aria-describedby={
                errors.branchId
                  ? "rc-branch-error"
                  : branchesError
                    ? "rc-branch-status"
                    : undefined
              }
              defaultValue=""
              {...register("branchId")}
            >
              <option value="" disabled>
                {branchesLoading ? t("form.branchLoading") : t("form.branchPlaceholder")}
              </option>
              {branches.map((branch) => (
                <option key={branch.id} value={branch.id}>
                  {(locale === "ar" ? branch.nameAr : branch.nameEn) || branch.city}
                </option>
              ))}
            </Select>
            {branchesError && (
              <p id="rc-branch-status" className="text-sm text-muted-foreground">
                {t("form.branchError")}
              </p>
            )}
            {errors.branchId?.message && (
              <p id="rc-branch-error" role="alert" className="text-sm text-destructive">
                {errors.branchId.message}
              </p>
            )}
          </div>

          {/* Table number — dine-in only */}
          {isDineIn && (
            <div className="space-y-2">
              <Label htmlFor="rc-table">{t("form.table")}</Label>
              <Input
                id="rc-table"
                inputMode="numeric"
                placeholder={t("form.tablePlaceholder")}
                aria-invalid={errors.tableId ? true : undefined}
                aria-describedby={errors.tableId ? "rc-table-error" : undefined}
                {...register("tableId")}
              />
              {errors.tableId?.message && (
                <p id="rc-table-error" role="alert" className="text-sm text-destructive">
                  {errors.tableId.message}
                </p>
              )}
            </div>
          )}

          {/* Scheduled time — pickup / delivery */}
          {canSchedule && (
            <div className="space-y-2">
              <Label htmlFor="rc-scheduled">
                {t("form.scheduledFor")}{" "}
                <span className="text-muted-foreground">({t("form.optional")})</span>
              </Label>
              <Input
                id="rc-scheduled"
                type="datetime-local"
                aria-invalid={errors.scheduledFor ? true : undefined}
                aria-describedby={errors.scheduledFor ? "rc-scheduled-error" : undefined}
                {...register("scheduledFor")}
              />
              {errors.scheduledFor?.message && (
                <p
                  id="rc-scheduled-error"
                  role="alert"
                  className="text-sm text-destructive"
                >
                  {errors.scheduledFor.message}
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delivery address — delivery only */}
      {isDelivery && (
        <Card>
          <CardContent className="space-y-5 p-6">
            <h2 className="font-display text-lg font-semibold">
              {t("form.deliveryHeading")}
            </h2>

            <div className="space-y-2">
              <Label htmlFor="rc-line1">{t("form.line1")}</Label>
              <Input
                id="rc-line1"
                autoComplete="address-line1"
                placeholder={t("form.line1Placeholder")}
                aria-invalid={errors.deliveryAddress?.line1 ? true : undefined}
                aria-describedby={
                  errors.deliveryAddress?.line1 ? "rc-line1-error" : undefined
                }
                {...register("deliveryAddress.line1")}
              />
              {errors.deliveryAddress?.line1?.message && (
                <p id="rc-line1-error" role="alert" className="text-sm text-destructive">
                  {errors.deliveryAddress.line1.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="rc-line2">
                {t("form.line2")}{" "}
                <span className="text-muted-foreground">({t("form.optional")})</span>
              </Label>
              <Input
                id="rc-line2"
                autoComplete="address-line2"
                placeholder={t("form.line2Placeholder")}
                aria-invalid={errors.deliveryAddress?.line2 ? true : undefined}
                aria-describedby={
                  errors.deliveryAddress?.line2 ? "rc-line2-error" : undefined
                }
                {...register("deliveryAddress.line2")}
              />
              {errors.deliveryAddress?.line2?.message && (
                <p id="rc-line2-error" role="alert" className="text-sm text-destructive">
                  {errors.deliveryAddress.line2.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="rc-city">{t("form.city")}</Label>
              <Input
                id="rc-city"
                autoComplete="address-level2"
                placeholder={t("form.cityPlaceholder")}
                aria-invalid={errors.deliveryAddress?.city ? true : undefined}
                aria-describedby={
                  errors.deliveryAddress?.city ? "rc-city-error" : undefined
                }
                {...register("deliveryAddress.city")}
              />
              {errors.deliveryAddress?.city?.message && (
                <p id="rc-city-error" role="alert" className="text-sm text-destructive">
                  {errors.deliveryAddress.city.message}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Contact details */}
      <Card>
        <CardContent className="space-y-5 p-6">
          <h2 className="font-display text-lg font-semibold">
            {t("form.customerHeading")}
          </h2>

          <div className="space-y-2">
            <Label htmlFor="rc-name">{t("form.name")}</Label>
            <Input
              id="rc-name"
              autoComplete="name"
              placeholder={t("form.namePlaceholder")}
              aria-invalid={errors.customer?.name ? true : undefined}
              aria-describedby={errors.customer?.name ? "rc-name-error" : undefined}
              {...register("customer.name")}
            />
            {errors.customer?.name?.message && (
              <p id="rc-name-error" role="alert" className="text-sm text-destructive">
                {errors.customer.name.message}
              </p>
            )}
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="rc-email">{t("form.email")}</Label>
              <Input
                id="rc-email"
                type="email"
                inputMode="email"
                autoComplete="email"
                placeholder={t("form.emailPlaceholder")}
                aria-invalid={errors.customer?.email ? true : undefined}
                aria-describedby={errors.customer?.email ? "rc-email-error" : undefined}
                {...register("customer.email")}
              />
              {errors.customer?.email?.message && (
                <p id="rc-email-error" role="alert" className="text-sm text-destructive">
                  {errors.customer.email.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="rc-phone">{t("form.phone")}</Label>
              <Input
                id="rc-phone"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                placeholder={t("form.phonePlaceholder")}
                aria-invalid={errors.customer?.phone ? true : undefined}
                aria-describedby={errors.customer?.phone ? "rc-phone-error" : undefined}
                {...register("customer.phone")}
              />
              {errors.customer?.phone?.message && (
                <p id="rc-phone-error" role="alert" className="text-sm text-destructive">
                  {errors.customer.phone.message}
                </p>
              )}
            </div>
          </div>
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
