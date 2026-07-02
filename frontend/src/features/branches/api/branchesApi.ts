import { apiClient } from "@/lib/api/client";
import type { BranchDto } from "../types";

/**
 * Branches data access (PHASE2.md §3 REST contract). Server Components call these;
 * ISR revalidation keeps the locator fresh without SSR cost. Branch data changes
 * rarely, so a longer window than product listings is fine.
 */
const LIST_REVALIDATE = 900; // 15 min ISR
const DETAIL_REVALIDATE = 900;

export const branchesApi = {
  /** GET /branches -> BranchDto[] (with lat/lng for the map). */
  list: () =>
    apiClient.get<BranchDto[]>("/branches", {
      next: { revalidate: LIST_REVALIDATE, tags: ["branches"] },
    }),

  /** GET /branches/{slug} -> BranchDto. */
  getBySlug: (slug: string) =>
    apiClient.get<BranchDto>(`/branches/${slug}`, {
      next: { revalidate: DETAIL_REVALIDATE, tags: [`branch:${slug}`] },
    }),
};
