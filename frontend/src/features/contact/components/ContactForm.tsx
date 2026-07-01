"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useContactForm } from "../hooks/useContactForm";
import { MESSAGE_MAX, NAME_MAX } from "../types";
import { Textarea } from "./Textarea";

/**
 * Interactive leaf: the contact form. All logic lives in useContactForm; this
 * component is presentation only. Every label/placeholder/error is i18n-driven,
 * fields expose aria-invalid + aria-describedby, and errors use role="alert" so
 * screen readers announce them. Native validation is disabled (noValidate) in
 * favor of zod so messages stay localized and consistent.
 */
export function ContactForm() {
  const t = useTranslations("contact");
  const { form, onSubmit } = useContactForm();
  const {
    register,
    formState: { errors, isSubmitting },
  } = form;

  return (
    <form noValidate onSubmit={onSubmit} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="contact-name">{t("form.name")}</Label>
        <Input
          id="contact-name"
          autoComplete="name"
          maxLength={NAME_MAX}
          placeholder={t("form.namePlaceholder")}
          aria-invalid={errors.name ? true : undefined}
          aria-describedby={errors.name ? "contact-name-error" : undefined}
          {...register("name")}
        />
        {errors.name?.message && (
          <p
            id="contact-name-error"
            role="alert"
            className="text-sm text-destructive"
          >
            {errors.name.message}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="contact-email">{t("form.email")}</Label>
        <Input
          id="contact-email"
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder={t("form.emailPlaceholder")}
          aria-invalid={errors.email ? true : undefined}
          aria-describedby={errors.email ? "contact-email-error" : undefined}
          {...register("email")}
        />
        {errors.email?.message && (
          <p
            id="contact-email-error"
            role="alert"
            className="text-sm text-destructive"
          >
            {errors.email.message}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="contact-message">{t("form.message")}</Label>
        <Textarea
          id="contact-message"
          rows={5}
          maxLength={MESSAGE_MAX}
          placeholder={t("form.messagePlaceholder")}
          aria-invalid={errors.message ? true : undefined}
          aria-describedby={errors.message ? "contact-message-error" : undefined}
          {...register("message")}
        />
        {errors.message?.message && (
          <p
            id="contact-message-error"
            role="alert"
            className="text-sm text-destructive"
          >
            {errors.message.message}
          </p>
        )}
      </div>

      <Button type="submit" size="lg" disabled={isSubmitting} aria-busy={isSubmitting}>
        {isSubmitting ? t("form.sending") : t("form.send")}
      </Button>
    </form>
  );
}
