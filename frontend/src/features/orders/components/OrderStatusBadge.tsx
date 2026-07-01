import { getTranslations } from "next-intl/server";
import { Badge } from "@/components/ui/badge";
import { normalizeStatus, statusTone } from "../types";

/**
 * Localized order status badge. Server Component: resolves the label from the
 * "orders" message catalog (falling back to the raw status for unknown values)
 * and picks a tone from the shared status→variant map.
 */
export async function OrderStatusBadge({
  status,
  className,
}: {
  status: string;
  className?: string;
}) {
  const t = await getTranslations("orders");
  const key = `status.${normalizeStatus(status)}`;
  const label = t.has(key) ? t(key) : status;

  return (
    <Badge variant={statusTone(status)} className={className}>
      {label}
    </Badge>
  );
}
