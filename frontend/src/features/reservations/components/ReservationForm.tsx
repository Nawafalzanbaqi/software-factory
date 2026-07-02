"use client";

import { useMemo } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link } from "@/lib/i18n/navigation";
import type { Locale } from "@/lib/i18n/routing";
import { useReservationForm } from "../hooks/useReservationForm";
import {
  localizeBranchName,
  NAME_MAX,
  NOTES_MAX,
  PARTY_MAX,
  PARTY_MIN,
  PHONE_MAX,
  type BranchDto,
} from "../types";
import { Select } from "./Select";

/** Local datetime-local `min` (now) so the picker itself discourages past times. */
function nowDateTimeLocal(): string {
  const now = new Date();
  now.setSeconds(0, 0);
  const tzOffset = now.getTimezoneOffset() * 60_000;
  return new Date(now.getTime() - tzOffset).toISOString().slice(0, 16);
}

/**
 * Interactive leaf: the reservation booking form. All logic lives in
 * useReservationForm; this component is presentation only. Every label/placeholder/
 * error is i18n-driven, fields expose aria-invalid + aria-describedby, and errors
 * use role="alert" so screen readers announce them. Native validation is disabled
 * (noValidate) in favor of zod so messages stay localized. On success the form is
 * replaced by an accessible confirmation linking to the tracking page.
 */
export function ReservationForm({ branches }: { branches: BranchDto[] }) {
  const t = useTranslations("reservations");
  const locale = useLocale() as Locale;
  const { form, onSubmit, reference } = useReservationForm();
  const {
    register,
    formState: { errors, isSubmitting },
  } = form;

  const minDateTime = useMemo(() => nowDateTimeLocal(), []);
  const partyOptions = useMemo(
    () =>
      Array.from({ length: PARTY_MAX - PARTY_MIN + 1 }, (_, i) => PARTY_MIN + i),
    [],
  );

  if (reference) {
    return (
      <div
        role="status"
        aria-live="polite"
        className="rounded-lg border border-input bg-muted/30 p-6 text-center"
      >
        <h2 className="font-display text-xl font-semibold">
          {t("confirmation.title")}
        </h2>
        <p className="mt-2 text-muted-foreground">
          {t("confirmation.subtitle")}
        </p>
        <p className="mt-4 text-sm text-muted-foreground">
          {t("confirmation.referenceLabel")}
        </p>
        <p className="font-mono text-lg font-semibold" dir="ltr">
          {reference}
        </p>
        <Button asChild size="lg" className="mt-6">
          <Link href={`/reservations/${reference}`}>
            {t("confirmation.trackCta")}
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <form noValidate onSubmit={onSubmit} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="reservation-branch">{t("form.branch")}</Label>
        <Select
          id="reservation-branch"
          defaultValue=""
          aria-invalid={errors.branchId ? true : undefined}
          aria-describedby={
            errors.branchId ? "reservation-branch-error" : undefined
          }
          {...register("branchId")}
        >
          <option value="" disabled>
            {t("form.branchPlaceholder")}
          </option>
          {branches.map((branch) => (
            <option key={branch.id} value={branch.id}>
              {localizeBranchName(branch, locale)}
            </option>
          ))}
        </Select>
        {errors.branchId?.message && (
          <p
            id="reservation-branch-error"
            role="alert"
            className="text-sm text-destructive"
          >
            {errors.branchId.message}
          </p>
        )}
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="reservation-party">{t("form.partySize")}</Label>
          <Select
            id="reservation-party"
            aria-invalid={errors.partySize ? true : undefined}
            aria-describedby={
              errors.partySize ? "reservation-party-error" : undefined
            }
            {...register("partySize")}
          >
            {partyOptions.map((n) => (
              <option key={n} value={n}>
                {t("form.partySizeOption", { count: n })}
              </option>
            ))}
          </Select>
          {errors.partySize?.message && (
            <p
              id="reservation-party-error"
              role="alert"
              className="text-sm text-destructive"
            >
              {errors.partySize.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="reservation-datetime">{t("form.dateTime")}</Label>
          <Input
            id="reservation-datetime"
            type="datetime-local"
            min={minDateTime}
            aria-invalid={errors.dateTime ? true : undefined}
            aria-describedby={
              errors.dateTime ? "reservation-datetime-error" : undefined
            }
            {...register("dateTime")}
          />
          {errors.dateTime?.message && (
            <p
              id="reservation-datetime-error"
              role="alert"
              className="text-sm text-destructive"
            >
              {errors.dateTime.message}
            </p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="reservation-name">{t("form.name")}</Label>
        <Input
          id="reservation-name"
          autoComplete="name"
          maxLength={NAME_MAX}
          placeholder={t("form.namePlaceholder")}
          aria-invalid={errors.name ? true : undefined}
          aria-describedby={errors.name ? "reservation-name-error" : undefined}
          {...register("name")}
        />
        {errors.name?.message && (
          <p
            id="reservation-name-error"
            role="alert"
            className="text-sm text-destructive"
          >
            {errors.name.message}
          </p>
        )}
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="reservation-email">{t("form.email")}</Label>
          <Input
            id="reservation-email"
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder={t("form.emailPlaceholder")}
            aria-invalid={errors.email ? true : undefined}
            aria-describedby={
              errors.email ? "reservation-email-error" : undefined
            }
            {...register("email")}
          />
          {errors.email?.message && (
            <p
              id="reservation-email-error"
              role="alert"
              className="text-sm text-destructive"
            >
              {errors.email.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="reservation-phone">{t("form.phone")}</Label>
          <Input
            id="reservation-phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            maxLength={PHONE_MAX}
            placeholder={t("form.phonePlaceholder")}
            aria-invalid={errors.phone ? true : undefined}
            aria-describedby={
              errors.phone ? "reservation-phone-error" : undefined
            }
            {...register("phone")}
          />
          {errors.phone?.message && (
            <p
              id="reservation-phone-error"
              role="alert"
              className="text-sm text-destructive"
            >
              {errors.phone.message}
            </p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="reservation-notes">{t("form.notes")}</Label>
        <textarea
          id="reservation-notes"
          rows={4}
          maxLength={NOTES_MAX}
          placeholder={t("form.notesPlaceholder")}
          aria-invalid={errors.notes ? true : undefined}
          aria-describedby={errors.notes ? "reservation-notes-error" : undefined}
          className="flex min-h-24 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50"
          {...register("notes")}
        />
        {errors.notes?.message && (
          <p
            id="reservation-notes-error"
            role="alert"
            className="text-sm text-destructive"
          >
            {errors.notes.message}
          </p>
        )}
      </div>

      <Button type="submit" size="lg" disabled={isSubmitting} aria-busy={isSubmitting}>
        {isSubmitting ? t("form.submitting") : t("form.submit")}
      </Button>
    </form>
  );
}
