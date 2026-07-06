import { getTranslations } from "next-intl/server";
import { ShoppingBag, Search } from "lucide-react";
import { Link } from "@/lib/i18n/navigation";
import { Button } from "@/components/ui/button";
import { getPrimaryNav, getUtilityNav } from "./nav-items";
import { LocaleSwitcher } from "./LocaleSwitcher";
import { MobileNav } from "./MobileNav";
import { AccountMenu } from "./AccountMenu";
import { isFeatureEnabled } from "@/lib/config/options";
import { CartTrigger } from "@/features/cart";
import { SearchBar } from "@/features/search";

/**
 * Config-driven header (Server Component). Nav items are resolved from
 * options.json so only enabled features/sections appear. Interactive leaves
 * (locale switcher, mobile drawer, cart badge) are the only client parts.
 */
export async function Header() {
  const t = await getTranslations("nav");
  const tc = await getTranslations("common");
  const [primary, utility, searchEnabled] = await Promise.all([
    getPrimaryNav(),
    getUtilityNav(),
    isFeatureEnabled("search"),
  ]);

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="container flex h-16 items-center gap-4">
        <MobileNav primary={primary} utility={utility} />

        <Link href="/" className="flex items-center gap-2.5 font-display text-lg font-semibold">
          <span aria-hidden="true" className="icon-chip size-8 rounded-lg">
            <ShoppingBag className="size-5" />
          </span>
          <span>{tc("brand")}</span>
        </Link>

        <nav
          aria-label={tc("menu")}
          className="mx-2 hidden items-center gap-1 md:flex"
        >
          {primary.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-md px-3 py-2 text-sm font-medium text-foreground/80 transition-colors hover:bg-secondary/70 hover:text-foreground"
            >
              {t(item.labelKey)}
            </Link>
          ))}
        </nav>

        {searchEnabled && (
          <div className="ms-auto hidden w-full max-w-xs lg:block">
            <SearchBar />
          </div>
        )}

        <div className={`flex items-center gap-1 ${searchEnabled ? "lg:ms-2" : "ms-auto"}`}>
          {searchEnabled && (
            <Button
              asChild
              variant="ghost"
              size="icon"
              aria-label={t("search")}
              className="lg:hidden"
            >
              <Link href="/search">
                <Search className="size-5" aria-hidden="true" />
              </Link>
            </Button>
          )}
          <CartTrigger />
          {/* Account menu: desktop only (mobile reaches account links via the drawer). */}
          <div className="hidden md:block">
            <AccountMenu items={utility} />
          </div>
          <LocaleSwitcher />
        </div>
      </div>
    </header>
  );
}
