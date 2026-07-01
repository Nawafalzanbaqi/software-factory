"use client";

import { useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { toast } from "@/components/ui/sonner";
import { contactApi } from "../api/contactApi";
import { contactFormSchema, type ContactFormValues } from "../types";

/**
 * Encapsulates the contact form logic: react-hook-form + zod validation with
 * i18n error messages, submission via the api client, and success/error toasts
 * (sonner). Keeps ContactForm a thin, presentational client leaf.
 */
export function useContactForm() {
  const t = useTranslations("contact");

  // Rebuild the schema when the translator changes (locale switch) so validation
  // messages stay localized. Literal message keys keep this fully type-safe.
  const schema = useMemo(() => contactFormSchema(t), [t]);

  const form = useForm<ContactFormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", email: "", message: "" },
    mode: "onBlur",
  });

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      await contactApi.submit(values);
      toast.success(t("toast.success"));
      form.reset();
    } catch {
      // ApiError (network / non-2xx) — surface a generic, localized failure.
      // TODO (backlog): map field-level 422 validation errors from the backend
      // onto form fields via form.setError once the error envelope is finalized.
      toast.error(t("toast.error"));
    }
  });

  return { form, onSubmit };
}
