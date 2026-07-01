"use client";

import { useSession, signOut } from "next-auth/react";
import { useTranslations } from "next-intl";
import { User, Heart, Package, LayoutDashboard, LogIn, LogOut } from "lucide-react";
import { Link } from "@/lib/i18n/navigation";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { NavItem } from "./nav-items";

const ICONS: Record<string, typeof User> = {
  orders: Package,
  wishlist: Heart,
  dashboard: LayoutDashboard,
};

/**
 * Interactive leaf: the desktop account menu. Session-aware so `authOnly` nav
 * items (wishlist, dashboard) only appear once signed in — this is where the
 * `authOnly` contract is actually enforced. Public items (order tracking) show
 * to everyone. Anonymous visitors get a Sign in action; authenticated visitors
 * get Sign out.
 */
export function AccountMenu({ items }: { items: NavItem[] }) {
  const t = useTranslations("nav");
  const { status } = useSession();
  const authed = status === "authenticated";

  const visible = items.filter((i) => !i.authOnly || authed);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label={t("account")}>
          <User className="size-5" aria-hidden="true" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel>{t("account")}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {visible.map((item) => {
          const Icon = ICONS[item.labelKey] ?? User;
          return (
            <DropdownMenuItem key={item.href} asChild>
              <Link href={item.href} className="flex items-center gap-2">
                <Icon className="size-4" aria-hidden="true" />
                <span>{t(item.labelKey)}</span>
              </Link>
            </DropdownMenuItem>
          );
        })}
        <DropdownMenuSeparator />
        {authed ? (
          <DropdownMenuItem
            onSelect={(e) => {
              e.preventDefault();
              void signOut({ callbackUrl: "/" });
            }}
            className="flex items-center gap-2"
          >
            <LogOut className="size-4" aria-hidden="true" />
            <span>{t("signOut")}</span>
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem asChild>
            <Link href="/sign-in" className="flex items-center gap-2">
              <LogIn className="size-4" aria-hidden="true" />
              <span>{t("signIn")}</span>
            </Link>
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
