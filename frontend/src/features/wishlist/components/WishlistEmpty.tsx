import { getTranslations } from "next-intl/server";
import { Heart } from "lucide-react";
import { Link } from "@/lib/i18n/navigation";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";

/** Empty-state shown when the authenticated user has no saved products. */
export async function WishlistEmpty() {
  const t = await getTranslations("wishlist");

  return (
    <EmptyState
      icon={<Heart className="size-6" />}
      message={t("empty")}
      action={
        <Button asChild>
          <Link href="/products">{t("emptyCta")}</Link>
        </Button>
      }
    />
  );
}
