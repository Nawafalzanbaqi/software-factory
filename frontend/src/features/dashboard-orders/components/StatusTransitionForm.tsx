import { getTranslations } from "next-intl/server";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { normalizeStatus } from "@/features/orders";
import { transitionOrderStatusAction } from "../actions";
import { MANAGED_ORDER_STATUSES } from "../types";

/**
 * Zero-JS status transition: a plain form posting to a server action (native
 * <select>, no client component needed). The action re-checks the session role
 * and the backend enforces the DashboardStaff policy.
 */
export async function StatusTransitionForm({
  orderNumber,
  currentStatus,
}: {
  orderNumber: string;
  currentStatus: string;
}) {
  const t = await getTranslations("dashboardOrders");
  const tOrders = await getTranslations("orders");

  return (
    <form action={transitionOrderStatusAction} className="flex flex-wrap items-end gap-3">
      <input type="hidden" name="orderNumber" value={orderNumber} />
      <div className="space-y-1.5">
        <Label htmlFor="status">{t("transitionLabel")}</Label>
        <select
          id="status"
          name="status"
          defaultValue={
            MANAGED_ORDER_STATUSES.find(
              (s) => normalizeStatus(s) === normalizeStatus(currentStatus),
            ) ?? MANAGED_ORDER_STATUSES[0]
          }
          className="flex h-9 w-44 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        >
          {MANAGED_ORDER_STATUSES.map((status) => (
            <option key={status} value={status}>
              {tOrders(`status.${normalizeStatus(status)}`)}
            </option>
          ))}
        </select>
      </div>
      <Button type="submit">{t("transitionSubmit")}</Button>
    </form>
  );
}
