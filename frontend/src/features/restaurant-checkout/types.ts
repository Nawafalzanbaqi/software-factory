import { z } from "zod";

/**
 * Restaurant checkout form model + DTOs (PHASE2.md §3). This feature is the
 * restaurant counterpart to the ecommerce `checkout` feature: it posts a
 * `PlaceFoodOrderRequest` to POST /api/v1/checkout and reads branches from
 * GET /api/v1/branches.
 *
 * Per HARD RULE 2 the restaurant DTOs live HERE (own types.ts) rather than in
 * src/lib/api/types.ts — the shared api types file only carries the Phase-1
 * ecommerce contract. Shapes mirror PHASE2.md §3 exactly.
 */

/* ------------------------------- Backend DTOs ------------------------------ */

/**
 * Branch as returned by GET /api/v1/branches (PHASE2.md §3 BranchDto). Used to
 * populate the branch <select>. Includes lat/lng for parity with the locator
 * map, though this form only needs id + localized name.
 */
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
  openingHours: string;
}

/** A delivery destination — only sent when fulfillmentType === "delivery". */
export interface FoodDeliveryAddress {
  line1: string;
  line2?: string;
  city: string;
}

/**
 * POST /api/v1/checkout body for the restaurant vertical (PHASE2.md §3
 * PlaceFoodOrderRequest). Only ONE of the optional fulfillment fields is set
 * depending on `fulfillmentType`.
 */
export interface PlaceFoodOrderRequest {
  cartId: string;
  customer: { name: string; email: string; phone: string };
  fulfillmentType: FulfillmentType;
  branchId: string;
  tableId?: string;
  deliveryAddress?: FoodDeliveryAddress;
  scheduledFor?: string;
  paymentMethod: string;
}

/** POST /api/v1/checkout response (restaurant) — the tracking order number. */
export interface PlaceFoodOrderResponse {
  orderNumber: string;
}

/* -------------------------------- Constants -------------------------------- */

/** Fulfillment options offered by the restaurant checkout (PHASE2.md §3). */
export const FULFILLMENT_TYPES = ["dinein", "pickup", "delivery"] as const;
export type FulfillmentType = (typeof FULFILLMENT_TYPES)[number];
export const DEFAULT_FULFILLMENT_TYPE: FulfillmentType = "pickup";

/**
 * Restaurant payment methods. `options.restaurant.json` ships `payments: ["cod"]`;
 * cash/pay-at-venue is always available as a fallback so an order can always be
 * placed. Payment capture itself is out of scope.
 * TODO(phase-3): integrate real payment capture.
 */
export const RESTAURANT_PAYMENT_METHODS = ["cod"] as const;
export const DEFAULT_PAYMENT_METHOD = "cod";

export const NAME_MAX = 80;
export const LINE_MAX = 120;
export const CITY_MAX = 80;
export const PHONE_MAX = 20;
export const TABLE_MAX = 20;

/** Lenient international/Saudi phone pattern (digits, spaces, dashes, leading +). */
const PHONE_REGEX = /^\+?[0-9][0-9\s-]{6,19}$/;

/* --------------------------------- Schema ---------------------------------- */

/**
 * Zod schema factory for the restaurant checkout form. Accepts a translator so
 * validation messages are i18n-driven (keys resolve under the
 * "restaurantCheckout" namespace). Conditional fields (tableId for dine-in,
 * deliveryAddress for delivery) are enforced with a superRefine so the base
 * object stays flat and register()-friendly.
 */
export function restaurantCheckoutFormSchema(t: (key: string) => string) {
  return z
    .object({
      fulfillmentType: z.enum(FULFILLMENT_TYPES),
      branchId: z.string().trim().min(1, t("validation.branchRequired")),
      tableId: z.string().trim().max(TABLE_MAX, t("validation.tableMax")).optional(),
      scheduledFor: z.string().trim().optional(),
      customer: z.object({
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
          .min(1, t("validation.phoneRequired"))
          .max(PHONE_MAX, t("validation.phoneInvalid"))
          .regex(PHONE_REGEX, t("validation.phoneInvalid")),
      }),
      deliveryAddress: z.object({
        line1: z.string().trim().max(LINE_MAX, t("validation.line1Max")).optional(),
        line2: z.string().trim().max(LINE_MAX, t("validation.line2Max")).optional(),
        city: z.string().trim().max(CITY_MAX, t("validation.cityMax")).optional(),
      }),
    })
    .superRefine((values, ctx) => {
      if (values.fulfillmentType === "dinein") {
        if (!values.tableId || values.tableId.length === 0) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["tableId"],
            message: t("validation.tableRequired"),
          });
        }
      }
      if (values.fulfillmentType === "delivery") {
        if (!values.deliveryAddress.line1 || values.deliveryAddress.line1.length === 0) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["deliveryAddress", "line1"],
            message: t("validation.line1Required"),
          });
        }
        if (!values.deliveryAddress.city || values.deliveryAddress.city.length === 0) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["deliveryAddress", "city"],
            message: t("validation.cityRequired"),
          });
        }
      }
    });
}

/** Form values inferred from the schema (parsed/trimmed shape). */
export type RestaurantCheckoutFormValues = z.infer<
  ReturnType<typeof restaurantCheckoutFormSchema>
>;
