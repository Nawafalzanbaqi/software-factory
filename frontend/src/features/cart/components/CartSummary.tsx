"use client";

import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/lib/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { formatPrice } from "@/lib/utils";
import type { Locale } from "@/lib/i18n/routing";
import { useCart } from "../hooks/useCart";

/** Interactive leaf: order summary with subtotal and checkout CTA. */
export function CartSummary() {
  const locale = useLocale() as Locale;
  const t = useTranslations("cart");
  const { subtotal, currency, count } = useCart();

  return (
    <Card className="sticky top-20">
      <CardContent className="space-y-4 p-6">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">{t("subtotal")}</span>
          <span className="font-medium tabular-nums">
            {formatPrice(subtotal, currency, locale)}
          </span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">{t("shipping")}</span>
          <span className="text-muted-foreground">{t("shippingNote")}</span>
        </div>
        <Separator />
        <div className="flex items-center justify-between text-base font-semibold">
          <span>{t("total")}</span>
          <span className="tabular-nums">
            {formatPrice(subtotal, currency, locale)}
          </span>
        </div>
        <Button asChild size="lg" className="w-full" disabled={count === 0}>
          <Link href="/checkout">{t("checkout")}</Link>
        </Button>
        <Button asChild variant="ghost" className="w-full">
          <Link href="/products">{t("continueShopping")}</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
