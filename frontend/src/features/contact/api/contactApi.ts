import { apiClient } from "@/lib/api/client";
import type { ContactRequest } from "../types";

/**
 * Contact data access (ARCHITECTURE.md §2 REST contract). The form submits from a
 * client leaf, so this runs in the browser and returns nothing on success (the
 * endpoint responds 200/204 with an empty body).
 */
export const contactApi = {
  submit: (payload: ContactRequest) => apiClient.post<void>("/contact", payload),
};
