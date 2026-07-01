"use client";

import { useTranslations } from "next-intl";
import { Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

/** Interactive leaf: accessible +/- quantity control. */
export function QuantityStepper({
  value,
  onChange,
  min = 1,
  max = 99,
}: {
  value: number;
  onChange: (next: number) => void;
  min?: number;
  max?: number;
}) {
  const t = useTranslations("products");

  return (
    <div
      className="inline-flex items-center rounded-md border"
      role="group"
      aria-label={t("quantity")}
    >
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="size-9 rounded-e-none"
        aria-label={t("decrease")}
        disabled={value <= min}
        onClick={() => onChange(Math.max(min, value - 1))}
      >
        <Minus className="size-4" aria-hidden="true" />
      </Button>
      <span
        className="min-w-10 text-center text-sm tabular-nums"
        aria-live="polite"
      >
        {value}
      </span>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="size-9 rounded-s-none"
        aria-label={t("increase")}
        disabled={value >= max}
        onClick={() => onChange(Math.min(max, value + 1))}
      >
        <Plus className="size-4" aria-hidden="true" />
      </Button>
    </div>
  );
}
