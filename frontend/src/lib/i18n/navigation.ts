import { createNavigation } from "next-intl/navigation";
import { routing } from "./routing";

/**
 * Locale-aware navigation primitives. Always import Link/redirect/router from here
 * (never next/link directly) so locale prefixes are handled consistently.
 */
export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing);
