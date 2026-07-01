"use client";

import { useTranslations } from "next-intl";
import { Heart } from "lucide-react";
import { Button, type ButtonProps } from "@/components/ui/button";
import { toast } from "@/components/ui/sonner";
import { cn } from "@/lib/utils";
import { useRouter } from "@/lib/i18n/navigation";
import { useWishlist } from "../hooks/useWishlist";

interface WishlistButtonProps
  extends Omit<ButtonProps, "onClick" | "children" | "onChange"> {
  /** Product id to save/remove (ProductDto.id). */
  productId: string;
  /** Whether the product is already in the wishlist (e.g. on the wishlist page). */
  initialInWishlist?: boolean;
  /** Fired after a successful toggle with the new membership state. */
  onChange?: (inWishlist: boolean) => void;
}

/**
 * Interactive leaf: a heart toggle that adds/removes a product from the wishlist
 * with optimistic UI + toast feedback. Barrel-exported so it can be dropped onto
 * the (Server Component) ProductCard. Auth is enforced by the server action.
 *
 * a11y: exposes `aria-pressed` (toggle state) and a localized `aria-label`.
 */
export function WishlistButton({
  productId,
  initialInWishlist = false,
  onChange,
  className,
  variant = "secondary",
  size = "icon",
  ...props
}: WishlistButtonProps) {
  const t = useTranslations("wishlist");
  const router = useRouter();
  const { inWishlist, pending, toggle } = useWishlist(productId, initialInWishlist);

  async function handleClick() {
    const wasInWishlist = inWishlist;
    const result = await toggle();

    if (result.ok) {
      toast.success(wasInWishlist ? t("removed") : t("added"));
      onChange?.(!wasInWishlist);
      return;
    }
    if (result.reason === "unauthenticated") {
      toast.error(t("signInRequired"), {
        action: {
          label: t("signIn"),
          onClick: () => router.push("/sign-in"),
        },
      });
      return;
    }
    toast.error(t("error"));
  }

  const label = inWishlist ? t("removeLabel") : t("addLabel");

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      aria-pressed={inWishlist}
      aria-label={label}
      title={label}
      disabled={pending}
      onClick={handleClick}
      className={cn("rounded-full", className)}
      {...props}
    >
      <Heart
        className={cn(
          "size-4 transition-colors",
          inWishlist && "fill-current text-accent",
        )}
        aria-hidden="true"
      />
    </Button>
  );
}
