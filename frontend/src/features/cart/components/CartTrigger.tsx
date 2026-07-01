"use client";

import { useTranslations } from "next-intl";
import { ShoppingCart } from "lucide-react";
import { Link } from "@/lib/i18n/navigation";
import { Button } from "@/components/ui/button";
import { useCartCount } from "../hooks/useCart";

/** Interactive leaf: header cart button with live item-count badge. */
export function CartTrigger() {
  const t = useTranslations("nav");
  const count = useCartCount();

  return (
    <Button asChild variant="ghost" size="icon" className="relative" aria-label={t("cart")}>
      <Link href="/cart">
        <ShoppingCart className="size-5" aria-hidden="true" />
        {count > 0 && (
          <span
            className="absolute -end-0.5 -top-0.5 flex min-w-5 items-center justify-center rounded-full bg-accent px-1 text-[11px] font-semibold leading-5 text-accent-foreground"
            aria-hidden="true"
          >
            {count}
          </span>
        )}
        <span className="sr-only">
          {t("cart")} ({count})
        </span>
      </Link>
    </Button>
  );
}
