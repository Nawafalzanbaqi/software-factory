"use client";

import { useState, useTransition, type FormEvent } from "react";
import { useTranslations } from "next-intl";
import { Package } from "lucide-react";
import { useRouter } from "@/lib/i18n/navigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

/**
 * Interactive leaf: public order lookup. Submitting navigates to the
 * locale-aware /orders/<number> tracking page (a Server Component fetches the
 * status). No auth — tracking by number is public per the REST contract.
 */
export function OrderLookupForm() {
  const t = useTranslations("orders");
  const router = useRouter();
  const [value, setValue] = useState("");
  const [error, setError] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const orderNumber = value.trim();
    if (!orderNumber) {
      setError(true);
      return;
    }
    setError(false);
    startTransition(() => {
      router.push(`/orders/${encodeURIComponent(orderNumber)}`);
    });
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-md space-y-3" noValidate>
      <div className="space-y-1.5">
        <Label htmlFor="order-number">{t("lookupLabel")}</Label>
        <Input
          id="order-number"
          name="orderNumber"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={t("lookupPlaceholder")}
          aria-invalid={error || undefined}
          aria-describedby={error ? "order-number-error" : undefined}
          autoComplete="off"
        />
        {error && (
          <p id="order-number-error" role="alert" className="text-sm text-destructive">
            {t("lookupInvalid")}
          </p>
        )}
      </div>
      <Button type="submit" disabled={isPending} className="gap-2">
        <Package className="size-4" aria-hidden="true" />
        {t("lookupSubmit")}
      </Button>
    </form>
  );
}
