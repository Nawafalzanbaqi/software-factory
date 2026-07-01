import { apiClient } from "@/lib/api/client";
import type { ReviewDto } from "@/lib/api/types";
import type { CreateReviewRequest } from "../types";

/**
 * Reviews data access (ARCHITECTURE.md §2 REST contract — feature-flagged module).
 *
 * `list` is called from a Server Component with short ISR so a newly posted review
 * appears promptly (the form also triggers router.refresh() on success). `create`
 * runs in the browser from the ReviewForm client leaf.
 */
const LIST_REVALIDATE = 120; // 2 min ISR — reviews change more often than catalog

export const reviewsApi = {
  list: (productId: string) =>
    apiClient.get<ReviewDto[]>(`/reviews/${productId}`, {
      next: { revalidate: LIST_REVALIDATE, tags: [`reviews:${productId}`] },
    }),

  create: (payload: CreateReviewRequest) =>
    apiClient.post<ReviewDto>("/reviews", payload),
};
