"use client";

import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { toast } from "@/components/ui/sonner";
import { reservationsApi } from "../api/reservationsApi";
import {
  reservationFormSchema,
  type ReservationFormValues,
} from "../types";

/**
 * Encapsulates the reservation booking form: react-hook-form + zod validation with
 * i18n error messages, submission via the api client, and a success/error toast
 * (sonner). On success it keeps the returned booking `reference` in state so the
 * form leaf can swap to a confirmation view linking to the tracking page. Keeps
 * ReservationForm a thin, presentational client leaf.
 */
export function useReservationForm() {
  const t = useTranslations("reservations");

  // Rebuild the schema when the translator changes (locale switch) so validation
  // messages stay localized. Literal message keys keep this fully type-safe.
  const schema = useMemo(() => reservationFormSchema(t), [t]);

  const [reference, setReference] = useState<string | null>(null);

  const form = useForm<ReservationFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      branchId: "",
      partySize: 2,
      dateTime: "",
      name: "",
      email: "",
      phone: "",
      notes: "",
    },
    mode: "onBlur",
  });

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      const res = await reservationsApi.create({
        branchId: values.branchId,
        customer: {
          name: values.name,
          email: values.email,
          phone: values.phone,
        },
        partySize: values.partySize,
        // datetime-local has no timezone; send an ISO instant.
        dateTime: new Date(values.dateTime).toISOString(),
        notes: values.notes?.trim() ? values.notes.trim() : undefined,
      });
      toast.success(t("toast.success"));
      setReference(res.reference);
      form.reset();
    } catch {
      // ApiError (network / non-2xx) — surface a generic, localized failure.
      // TODO (backlog): map field-level 422 validation errors onto form fields via
      // form.setError once the backend error envelope is finalized.
      toast.error(t("toast.error"));
    }
  });

  return { form, onSubmit, reference };
}
