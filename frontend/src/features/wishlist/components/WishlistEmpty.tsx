import { getTranslations } from "next-intl/server";
import { Heart } from "lucide-react";
import { Link } from "@/lib/i18n/navigation";
import { Button } from "@/components/ui/button";

/** Empty-state shown when the authenticated user has no saved products. */
export async function WishlistEmpty() {
  const t = await getTranslations("wishlist");

  return (
    <div className="flex flex-col items-center justify-center gap-4 rounded-lg border border-dashed py-16 text-center">
      <Heart className="size-10 text-muted-foreground" aria-hidden="true" />
      <p className="text-muted-foreground">{t("empty")}</p>
      <Button asChild>
        <Link href="/products">{t("emptyCta")}</Link>
      </Button>
    </div>
  );
}
