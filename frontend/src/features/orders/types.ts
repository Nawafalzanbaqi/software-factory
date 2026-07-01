import type { OrderDto, OrderItemDto, OrderTrackingDto } from "@/lib/api/types";
import type { Locale } from "@/lib/i18n/routing";
import type { BadgeProps } from "@/components/ui/badge";

export type { OrderDto, OrderItemDto, OrderTrackingDto };

/** A single point on the tracking timeline (see OrderTrackingDto §2). */
export type OrderTimelineEntry = OrderTrackingDto["timeline"][number];

/**
 * Canonical, normalized order statuses. These are the keys used for i18n labels
 * (messages "orders".status.*) and for the badge tone map below. Backend status
 * strings are normalized to these via `normalizeStatus`; unknown values fall
 * back gracefully to the raw string + a neutral tone.
 */
export const ORDER_STATUSES = [
  "pending",
  "confirmed",
  "processing",
  "shipped",
  "outForDelivery",
  "delivered",
  "cancelled",
  "returned",
] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

type BadgeTone = NonNullable<BadgeProps["variant"]>;

/** Badge tone per canonical status; unknown statuses fall back to "secondary". */
const STATUS_TONE: Record<string, BadgeTone> = {
  pending: "outline",
  confirmed: "secondary",
  processing: "secondary",
  shipped: "accent",
  outForDelivery: "accent",
  delivered: "default",
  cancelled: "destructive",
  returned: "destructive",
};

/**
 * Normalize an arbitrary backend status string to a stable camelCase key so it
 * matches both the i18n catalog and the tone map. Handles PascalCase enum names
 * ("OutForDelivery"), snake/kebab case ("out_for_delivery") and UPPERCASE.
 */
export function normalizeStatus(status: string): string {
  const raw = (status ?? "").trim();
  if (!raw) return raw;
  const parts = raw
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .split(/[\s_-]+/)
    .filter(Boolean);
  const [first, ...rest] = parts;
  if (!first) return raw.toLowerCase();
  return (
    first.toLowerCase() +
    rest.map((p) => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase()).join("")
  );
}

/** Badge variant/tone for a (possibly un-normalized) status string. */
export function statusTone(status: string): BadgeTone {
  return STATUS_TONE[normalizeStatus(status)] ?? "secondary";
}

/**
 * Locale-aware date+time for a timeline entry / order placement. Mirrors the
 * Intl approach in lib/utils.formatPrice so Arabic renders Arabic-Indic digits.
 * Falls back to the raw value for unparseable input.
 */
export function formatDateTime(value: string, locale: Locale): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  try {
    return new Intl.DateTimeFormat(locale === "ar" ? "ar-SA" : "en-US", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(date);
  } catch {
    return value;
  }
}

/** Locale-aware display name for an order line item. */
export function localizeOrderItemName(item: OrderItemDto, locale: Locale): string {
  return locale === "ar" ? item.nameAr : item.nameEn;
}
