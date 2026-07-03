"use client";

import type { ReactNode } from "react";
import { Link, usePathname } from "@/lib/i18n/navigation";
import { cn } from "@/lib/utils";

/**
 * Interactive leaf: locale-aware nav link with active-state highlight
 * (usePathname is client-only — the sole reason this is a client component).
 */
export function DashboardNavLink({ href, children }: { href: string; children: ReactNode }) {
  const pathname = usePathname();
  const active = href === "/dashboard" ? pathname === href : pathname.startsWith(href);

  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "rounded-md px-3 py-2 text-sm font-medium transition-colors",
        active
          ? "bg-accent/10 text-accent"
          : "text-muted-foreground hover:bg-muted hover:text-foreground",
      )}
    >
      {children}
    </Link>
  );
}
