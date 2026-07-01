import { z } from "zod";

/**
 * Request body for POST /api/v1/contact (ARCHITECTURE.md §2 REST contract).
 *
 * There is no Contact DTO in src/lib/api/types (the contract only defines the
 * request shape `{ name, email, message }`), so it is declared here rather than
 * reinventing a shared type. Field constraints mirror the backend
 * FluentValidation rules for this endpoint.
 */
export interface ContactRequest {
  name: string;
  email: string;
  message: string;
}

export const NAME_MAX = 80;
export const MESSAGE_MIN = 10;
export const MESSAGE_MAX = 1000;

/**
 * Zod schema factory for the contact form. Accepts a translator so validation
 * messages are i18n-driven (no hardcoded copy). Keys resolve under the "contact"
 * namespace. The inferred output matches {@link ContactRequest}.
 */
export function contactFormSchema(t: (key: string) => string) {
  return z.object({
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
    message: z
      .string()
      .trim()
      .min(MESSAGE_MIN, t("validation.messageMin"))
      .max(MESSAGE_MAX, t("validation.messageMax")),
  });
}

/** Form values inferred from the schema — identical shape to ContactRequest. */
export type ContactFormValues = z.infer<ReturnType<typeof contactFormSchema>>;
