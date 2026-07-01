"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useSession, signOut } from "next-auth/react";
import { Menu, LogIn, LogOut } from "lucide-react";
import { Link } from "@/lib/i18n/navigation";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import type { NavItem } from "./nav-items";

/**
 * Interactive leaf: mobile drawer nav. Receives config-resolved items as props.
 * Session-aware: `authOnly` utility items (wishlist, dashboard) render only when
 * authenticated — the enforcement point for the mobile surface — and a sign
 * in/out action is appended.
 */
export function MobileNav({
  primary,
  utility,
}: {
  primary: NavItem[];
  utility: NavItem[];
}) {
  const t = useTranslations("nav");
  const tc = useTranslations("common");
  const { status } = useSession();
  const authed = status === "authenticated";
  const [open, setOpen] = useState(false);

  const visibleUtility = utility.filter((i) => !i.authOnly || authed);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          aria-label={tc("menu")}
        >
          <Menu className="size-5" aria-hidden="true" />
        </Button>
      </SheetTrigger>
      <SheetContent side="start" className="w-72">
        <SheetHeader>
          <SheetTitle>{tc("brand")}</SheetTitle>
        </SheetHeader>
        <nav aria-label={tc("menu")} className="mt-6 flex flex-col gap-1">
          {primary.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className="rounded-md px-3 py-2 text-base font-medium hover:bg-accent hover:text-accent-foreground"
            >
              {t(item.labelKey)}
            </Link>
          ))}
          {visibleUtility.length > 0 && <Separator className="my-2" />}
          {visibleUtility.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className="rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            >
              {t(item.labelKey)}
            </Link>
          ))}
          <Separator className="my-2" />
          {authed ? (
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                void signOut({ callbackUrl: "/" });
              }}
              className="flex items-center gap-2 rounded-md px-3 py-2 text-start text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            >
              <LogOut className="size-4" aria-hidden="true" />
              {t("signOut")}
            </button>
          ) : (
            <Link
              href="/sign-in"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            >
              <LogIn className="size-4" aria-hidden="true" />
              {t("signIn")}
            </Link>
          )}
        </nav>
      </SheetContent>
    </Sheet>
  );
}
