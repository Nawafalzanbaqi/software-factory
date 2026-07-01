"use client";

import { useTranslations } from "next-intl";
import { Check, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCopyToClipboard } from "../hooks/useCopyToClipboard";

/**
 * Interactive leaf: copy the order number to the clipboard. Keeps the tracking
 * page a Server Component while isolating the small client island. Announces the
 * copied state to assistive tech via an aria-live region.
 */
export function CopyOrderNumber({ orderNumber }: { orderNumber: string }) {
  const t = useTranslations("orders");
  const { copied, copy } = useCopyToClipboard();

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => void copy(orderNumber)}
        aria-label={t("copy")}
      >
        {copied ? (
          <Check className="text-accent" aria-hidden="true" />
        ) : (
          <Copy aria-hidden="true" />
        )}
        <span>{copied ? t("copied") : t("copy")}</span>
      </Button>
      <span role="status" aria-live="polite" className="sr-only">
        {copied ? t("copied") : ""}
      </span>
    </>
  );
}
