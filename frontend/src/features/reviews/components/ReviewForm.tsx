"use client";

import { Controller } from "react-hook-form";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useReviewForm } from "../hooks/useReviewForm";
import { BODY_MAX, TITLE_MAX } from "../types";
import { StarRatingInput } from "./StarRatingInput";
import { Textarea } from "./Textarea";

/**
 * Interactive leaf: the "write a review" form. All logic lives in useReviewForm;
 * this component is presentation only. The rating is a custom control driven by a
 * react-hook-form <Controller>; every label/placeholder/error is i18n-driven and
 * fields expose aria-invalid + aria-describedby with role="alert" errors. Native
 * validation is disabled (noValidate) in favor of zod so messages stay localized.
 */
export function ReviewForm({ productId }: { productId: string }) {
  const t = useTranslations("reviews");
  const { form, onSubmit } = useReviewForm(productId);
  const {
    register,
    control,
    formState: { errors, isSubmitting },
  } = form;

  return (
    <form noValidate onSubmit={onSubmit} className="space-y-5">
      <h3 className="font-display text-lg font-semibold">{t("form.title")}</h3>

      <div className="space-y-2">
        <Label id="review-rating-label">{t("form.rating")}</Label>
        <Controller
          name="rating"
          control={control}
          render={({ field, fieldState }) => (
            <StarRatingInput
              value={field.value}
              onChange={field.onChange}
              name={field.name}
              ariaLabelledBy="review-rating-label"
              getOptionLabel={(n) => t("form.ratingOption", { count: n })}
              invalid={!!fieldState.error}
              describedById={fieldState.error ? "review-rating-error" : undefined}
            />
          )}
        />
        {errors.rating?.message && (
          <p id="review-rating-error" role="alert" className="text-sm text-destructive">
            {errors.rating.message}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="review-title">{t("form.reviewTitle")}</Label>
        <Input
          id="review-title"
          maxLength={TITLE_MAX}
          placeholder={t("form.reviewTitlePlaceholder")}
          aria-invalid={errors.title ? true : undefined}
          aria-describedby={errors.title ? "review-title-error" : undefined}
          {...register("title")}
        />
        {errors.title?.message && (
          <p id="review-title-error" role="alert" className="text-sm text-destructive">
            {errors.title.message}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="review-body">{t("form.body")}</Label>
        <Textarea
          id="review-body"
          rows={5}
          maxLength={BODY_MAX}
          placeholder={t("form.bodyPlaceholder")}
          aria-invalid={errors.body ? true : undefined}
          aria-describedby={errors.body ? "review-body-error" : undefined}
          {...register("body")}
        />
        {errors.body?.message && (
          <p id="review-body-error" role="alert" className="text-sm text-destructive">
            {errors.body.message}
          </p>
        )}
      </div>

      <Button type="submit" size="lg" disabled={isSubmitting} aria-busy={isSubmitting}>
        {isSubmitting ? t("form.submitting") : t("form.submit")}
      </Button>
    </form>
  );
}
