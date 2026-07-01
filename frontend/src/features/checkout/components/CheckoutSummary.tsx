"use client";

import { useLocale, useTranslations } from "next-intl";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { formatPrice } from "@/lib/utils";
import type { Locale } from "@/lib/i18n/routing";
import { useCart } from "@/features/cart";

/**
 * Interactive leaf: order summary panel built from the client cart. Lists each
 * line item with quantity + line total, then subtotal / shipping / total. Sticky
 * on large screens so it stays in view while the form scrolls.
 */
export function CheckoutSummary() {
  const locale = useLocale() as Locale;
  const t = useTranslations("checkout");
  const { lines, subtotal, currency } = useCart();

  return (
    <Card className="h-fit lg:sticky lg:top-20">
      <CardContent className="space-y-4 p-6">
        <h2 className="font-display text-lg font-semibold">{t("summary.title")}</h2>

        <ul className="space-y-3">
          {lines.map((line) => {
            const name = locale === "ar" ? line.nameAr : line.nameEn;
            return (
              <li
                key={line.productId}
                className="flex items-start justify-between gap-3 text-sm"
              >
                <span className="flex flex-col">
                  <span className="font-medium">{name}</span>
                  <span className="text-muted-foreground">
                    {t("summary.quantity", { count: line.quantity })}
                  </span>
                </span>
                <span className="whitespace-nowrap tabular-nums">
                  {formatPrice(line.price * line.quantity, line.currency, locale)}
                </span>
              </li>
            );
          })}
        </ul>

        <Separator />

        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">{t("summary.subtotal")}</span>
          <span className="font-medium tabular-nums">
            {formatPrice(subtotal, currency, locale)}
          </span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">{t("summary.shipping")}</span>
          <span className="text-muted-foreground">{t("summary.shippingNote")}</span>
        </div>

        <Separator />

        <div className="flex items-center justify-between text-base font-semibold">
          <span>{t("summary.total")}</span>
          <span className="tabular-nums">{formatPrice(subtotal, currency, locale)}</span>
        </div>
      </CardContent>
    </Card>
  );
}
