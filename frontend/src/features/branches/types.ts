import type { Locale } from "@/lib/i18n/routing";

/**
 * Branches feature DTOs (PHASE2.md §3). Defined locally per the feature-isolation
 * rule — do NOT edit src/lib/api/types.ts. Mirrors the backend `BranchDto` returned
 * by GET /api/v1/branches, including latitude/longitude for the locator map.
 */

/** A single weekly opening-hours row. Mirrors the CMS `OpeningHour` shape. */
export interface BranchHours {
  /** Day label as returned by the backend (e.g. "monday" / "Monday"). */
  day: string;
  /** 24h open time, e.g. "12:00". Absent when `closed`. */
  opens?: string;
  /** 24h close time, e.g. "23:00". Absent when `closed`. */
  closes?: string;
  /** True when the branch is closed that day. */
  closed?: boolean;
}

/** Restaurant branch (backend GET /api/v1/branches). */
export interface BranchDto {
  id: string;
  slug: string;
  nameEn: string;
  nameAr: string;
  addressEn: string;
  addressAr: string;
  city: string;
  latitude: number;
  longitude: number;
  phone: string;
  openingHours: BranchHours[];
}

/** Locale-aware display fields for a branch. */
export function localizeBranch(branch: BranchDto, locale: Locale) {
  return {
    name: locale === "ar" ? branch.nameAr : branch.nameEn,
    address: locale === "ar" ? branch.addressAr : branch.addressEn,
  };
}

/** True when the branch carries usable map coordinates. */
export function hasGeo(branch: BranchDto): boolean {
  return (
    typeof branch.latitude === "number" &&
    typeof branch.longitude === "number" &&
    Number.isFinite(branch.latitude) &&
    Number.isFinite(branch.longitude)
  );
}

/** Map a day label to a schema.org two-letter day code (Mo, Tu, …). */
const DAY_CODES: Record<string, string> = {
  sun: "Su",
  mon: "Mo",
  tue: "Tu",
  wed: "We",
  thu: "Th",
  fri: "Fr",
  sat: "Sa",
};

/**
 * Convert a branch's opening hours to schema.org OpeningHoursSpecification-style
 * strings (e.g. "Mo 12:00-23:00") for LocalBusiness/Restaurant JSON-LD. Closed days
 * and rows missing an open/close time are skipped.
 */
export function toSchemaOpeningHours(hours: BranchHours[]): string[] {
  return hours
    .filter((h) => !h.closed && h.opens && h.closes)
    .map((h) => {
      const code = DAY_CODES[h.day.slice(0, 3).toLowerCase()];
      const range = `${h.opens}-${h.closes}`;
      return code ? `${code} ${range}` : range;
    });
}

/** OpenStreetMap "directions"/view URL centered on the branch marker. */
export function osmDirectionsUrl(branch: BranchDto): string {
  const { latitude: lat, longitude: lng } = branch;
  return `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=17/${lat}/${lng}`;
}
