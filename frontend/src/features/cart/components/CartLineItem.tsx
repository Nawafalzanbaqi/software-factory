"use client";

import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/utils";
import type { Locale } from "@/lib/i18n/routing";
import { QuantityStepper } from "./QuantityStepper";
import { useCart } from "../hooks/useCart";
import type { CartLine } from "../types";

/** Interactive leaf: a single cart row with quantity + remove controls. */
export function CartLineItem({ line }: { line: CartLine }) {
  const locale = useLocale() as Locale;
  const t = useTranslations("cart");
  const { setQuantity, remove } = useCart();
  const name = locale === "ar" ? line.nameAr : line.nameEn;

  return (
    <li className="flex gap-4 py-4">
      <div className="relative size-20 shrink-0 overflow-hidden rounded-md border bg-muted">
        <Image
          src={line.imageUrl}
          alt={name}
          fill
          sizes="80px"
          className="object-cover"
        />
      </div>
      <div className="flex flex-1 flex-col gap-2">
        <div className="flex items-start justify-between gap-2">
          <p className="font-medium">{name}</p>
          <p className="whitespace-nowrap font-medium tabular-nums">
            {formatPrice(line.price * line.quantity, line.currency, locale)}
          </p>
        </div>
        <div className="flex items-center justify-between">
          <QuantityStepper
            value={line.quantity}
            onChange={(q) => setQuantity(line.productId, q)}
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-destructive"
            onClick={() => remove(line.productId)}
          >
            <Trash2 className="size-4" aria-hidden="true" />
            <span>{t("remove")}</span>
          </Button>
        </div>
      </div>
    </li>
  );
}
