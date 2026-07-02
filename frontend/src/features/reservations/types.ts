import { z } from "zod";
import type { Locale } from "@/lib/i18n/routing";

/**
 * Restaurant reservations DTOs + form schema (PHASE2.md §3).
 *
 * These DTOs are declared HERE (not in src/lib/api/types) per the feature-ownership
 * rule — each restaurant feature owns its own DTO types. Field shapes mirror the
 * backend REST contract exactly.
 */

/** GET /api/v1/branches — restaurant branch (with geo + opening hours). */
export interface OpeningHourDto {
  day: string;
  opens?: string;
  closes?: string;
  closed?: boolean;
}

export interface BranchDto {
  id: string;
  slug: string;
  nameEn: string;
  nameAr: string;
  addressEn?: string;
  addressAr?: string;
  city?: string;
  latitude?: number;
  longitude?: number;
  phone?: string;
  openingHours?: OpeningHourDto[];
}

/** GET /api/v1/reservations/{reference} — a tracked reservation. */
export interface ReservationDto {
  reference: string;
  branchId: string;
  status: string;
  partySize: number;
  dateTime: string;
  customerName: string;
  createdAt: string;
}

/** POST /api/v1/reservations request body. */
export interface CreateReservationRequest {
  branchId: string;
  customer: { name: string; email: string; phone: string };
  partySize: number;
  dateTime: string;
  tableId?: string;
  notes?: string;
}

/** POST /api/v1/reservations response. */
export interface CreateReservationResponse {
  reference: string;
}

/** Locale-aware branch display name. */
export function localizeBranchName(branch: BranchDto, locale: Locale): string {
  return locale === "ar" ? branch.nameAr : branch.nameEn;
}

/** Known reservation statuses (for i18n label lookup; unknown values fall back). */
export const RESERVATION_STATUSES = [
  "pending",
  "confirmed",
  "seated",
  "completed",
  "cancelled",
] as const;

export const NAME_MAX = 80;
export const PHONE_MIN = 6;
export const PHONE_MAX = 20;
export const NOTES_MAX = 500;
export const PARTY_MIN = 1;
export const PARTY_MAX = 20;

/**
 * Zod schema factory for the reservation form. Accepts a translator so every
 * validation message is i18n-driven (no hardcoded copy). Keys resolve under the
 * "reservations" namespace. `dateTime` is an HTML datetime-local string, validated
 * to parse to a real moment strictly in the future.
 */
export function reservationFormSchema(t: (key: string) => string) {
  return z.object({
    branchId: z.string().trim().min(1, t("validation.branchRequired")),
    partySize: z.coerce
      .number({ invalid_type_error: t("validation.partySizeRequired") })
      .int(t("validation.partySizeInvalid"))
      .min(PARTY_MIN, t("validation.partySizeMin"))
      .max(PARTY_MAX, t("validation.partySizeMax")),
    dateTime: z
      .string()
      .trim()
      .min(1, t("validation.dateTimeRequired"))
      .refine((value) => !Number.isNaN(new Date(value).getTime()), {
        message: t("validation.dateTimeInvalid"),
      })
      .refine((value) => new Date(value).getTime() > Date.now(), {
        message: t("validation.dateTimeFuture"),
      }),
    name: z
      .string()
      .trim()
      .min(1, t("validation.nameRequired"))
      .max(NAME_MAX, t("validation.nameMax")),
    email: z
      .string()
      .trim()
      .min(1, t("validation.emailRequired"))
      .email(t("validation.emailInvalid")),
    phone: z
      .string()
      .trim()
      .min(PHONE_MIN, t("validation.phoneMin"))
      .max(PHONE_MAX, t("validation.phoneMax")),
    notes: z.string().trim().max(NOTES_MAX, t("validation.notesMax")).optional(),
  });
}

/** Form values inferred from the schema. */
export type ReservationFormValues = z.infer<
  ReturnType<typeof reservationFormSchema>
>;
