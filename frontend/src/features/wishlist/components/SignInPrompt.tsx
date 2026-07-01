import { getTranslations } from "next-intl/server";
import { Lock } from "lucide-react";
import { Link } from "@/lib/i18n/navigation";
import { Button } from "@/components/ui/button";

/**
 * Rendered when an unauthenticated visitor opens the wishlist. The wishlist is
 * session-gated (ARCHITECTURE.md §4), so we prompt sign-in instead of calling
 * the authed API. Links to the Auth.js sign-in page (`pages.signIn`).
 */
export async function SignInPrompt() {
  const t = await getTranslations("wishlist");

  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-4 rounded-lg border py-16 text-center">
      <Lock className="size-10 text-muted-foreground" aria-hidden="true" />
      <h2 className="font-display text-xl font-semibold">{t("signInTitle")}</h2>
      <p className="text-muted-foreground">{t("signInBody")}</p>
      <Button asChild>
        {/* TODO (backlog): forward a callbackUrl back to /wishlist after sign-in. */}
        <Link href="/sign-in">{t("signIn")}</Link>
      </Button>
    </div>
  );
}
