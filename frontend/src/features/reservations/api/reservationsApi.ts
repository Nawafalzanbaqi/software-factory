import { apiClient } from "@/lib/api/client";
import type {
  BranchDto,
  CreateReservationRequest,
  CreateReservationResponse,
  ReservationDto,
} from "../types";

/**
 * Reservations data access (PHASE2.md §3 REST contract).
 *
 * - `listBranches` runs in a Server Component (booking page) and is ISR-cached —
 *   the branch list is slow-moving config.
 * - `create` posts from the client form leaf at runtime (no caching).
 * - `getByReference` powers the tracking page and must be fresh (no-store) so a
 *   status change is reflected immediately.
 */
const BRANCHES_REVALIDATE = 300; // 5 min ISR for the branch list

export const reservationsApi = {
  listBranches: () =>
    apiClient.get<BranchDto[]>("/branches", {
      next: { revalidate: BRANCHES_REVALIDATE, tags: ["branches"] },
    }),

  create: (payload: CreateReservationRequest) =>
    apiClient.post<CreateReservationResponse>("/reservations", payload),

  getByReference: (reference: string) =>
    apiClient.get<ReservationDto>(
      `/reservations/${encodeURIComponent(reference)}`,
      { cache: "no-store" },
    ),
};
