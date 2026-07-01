import type { ProductDto } from "@/lib/api/types";

/**
 * Search results are ProductDto[] (ARCHITECTURE.md §2 — GET /api/v1/search?q=).
 * Re-exported here so the feature owns a single import surface; the shared DTO
 * shape is never redefined.
 */
export type { ProductDto };
