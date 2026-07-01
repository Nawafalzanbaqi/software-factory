import { z } from "zod";
import type { ReviewDto } from "@/lib/api/types";

export type { ReviewDto };

/**
 * Request body for POST /api/v1/reviews (ARCHITECTURE.md §2 REST contract).
 *
 * The contract defines only the response DTO (ReviewDto). The create payload is a
 * subset of ReviewDto's own fields — no invented fields. `id`, `author` and
 * `createdAt` are assigned server-side (author from the authenticated session),
 * mirroring how the contact feature declares its own local request type.
 *
 * TODO (backlog): `author` is derived from the authenticated user on the backend
 * (Auth.js session → JWT `sub`/email). Wire the session token through the api
 * client once auth is finalized (see ARCHITECTURE.md §4).
 */
export interface CreateReviewRequest {
  productId: string;
  rating: number;
  title: string;
  body: string;
}

export const RATING_MIN = 1;
export const RATING_MAX = 5;
export const TITLE_MAX = 100;
export const BODY_MIN = 10;
export const BODY_MAX = 2000;

/**
 * Zod schema factory for the review form. Accepts a translator so validation
 * messages are i18n-driven (no hardcoded copy). Keys resolve under the "reviews"
 * namespace. The inferred output is the client-form subset of {@link CreateReviewRequest}
 * (productId is supplied by the mounting page, not the user).
 */
export function reviewFormSchema(t: (key: string) => string) {
  return z.object({
    rating: z
      .number()
      .int()
      .min(RATING_MIN, t("validation.ratingRequired"))
      .max(RATING_MAX, t("validation.ratingRequired")),
    title: z
      .string()
      .trim()
      .min(1, t("validation.titleRequired"))
      .max(TITLE_MAX, t("validation.titleMax")),
    body: z
      .string()
      .trim()
      .min(BODY_MIN, t("validation.bodyMin"))
      .max(BODY_MAX, t("validation.bodyMax")),
  });
}

/** Form values inferred from the schema (rating + title + body). */
export type ReviewFormValues = z.infer<ReturnType<typeof reviewFormSchema>>;

/** Average rating across a review list, rounded to one decimal. 0 when empty. */
export function getAverageRating(reviews: ReviewDto[]): number {
  if (reviews.length === 0) return 0;
  const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
  return Math.round((sum / reviews.length) * 10) / 10;
}
