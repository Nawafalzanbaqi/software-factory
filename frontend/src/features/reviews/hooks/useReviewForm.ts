"use client";

import { useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useRouter } from "@/lib/i18n/navigation";
import { toast } from "@/components/ui/sonner";
import { reviewsApi } from "../api/reviewsApi";
import { reviewFormSchema, type ReviewFormValues } from "../types";

/**
 * Encapsulates the review form logic: react-hook-form + zod validation with i18n
 * error messages, submission via the api client, and success/error toasts (sonner).
 * On success it refreshes the current route so the server-rendered ProductReviews
 * list + average pick up the new review. Keeps ReviewForm a thin client leaf.
 */
export function useReviewForm(productId: string) {
  const t = useTranslations("reviews");
  const router = useRouter();

  // Rebuild the schema when the translator changes (locale switch) so validation
  // messages stay localized. Literal message keys keep this fully type-safe.
  const schema = useMemo(() => reviewFormSchema(t), [t]);

  const form = useForm<ReviewFormValues>({
    resolver: zodResolver(schema),
    defaultValues: { rating: 0, title: "", body: "" },
    mode: "onBlur",
  });

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      await reviewsApi.create({ productId, ...values });
      toast.success(t("toast.success"));
      form.reset();
      // Re-fetch the Server Component list + average with the new review.
      router.refresh();
    } catch {
      // ApiError (network / non-2xx) — surface a generic, localized failure.
      // TODO (backlog): map field-level 422 validation errors from the backend
      // onto form fields via form.setError once the error envelope is finalized.
      toast.error(t("toast.error"));
    }
  });

  return { form, onSubmit };
}
