import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { Package, Heart, UserCog, LogIn } from "lucide-react";
import type { Locale } from "@/lib/i18n/routing";
import { Link } from "@/lib/i18n/navigation";
import { buildMetadata } from "@/lib/seo/metadata";
import { isFeatureEnabled } from "@/lib/config/options";
import { getSession } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

// User-specific + auth-gated → always dynamic, never indexed.
export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "dashboard" });
  return buildMetadata({
    locale,
    title: t("title"),
    description: t("guestBody"),
    path: "/dashboard",
    noIndex: true,
  });
}

export default async function DashboardPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  // Feature-flag gate (options.json features.clientDashboard).
  if (!(await isFeatureEnabled("clientDashboard"))) notFound();

  const t = await getTranslations("dashboard");
  const session = await getSession();

  // Guest state: prompt sign-in instead of redirecting to an out-of-context page.
  if (!session?.user) {
    return (
      <div className="container flex min-h-[60vh] items-center justify-center section-y">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <CardTitle className="font-display text-2xl">{t("guestTitle")}</CardTitle>
            <CardDescription>{t("guestBody")}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full gap-2">
              <Link href="/sign-in">
                <LogIn className="size-4" aria-hidden="true" />
                {t("signInCta")}
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const name = session.user.name ?? session.user.email ?? "";
  const wishlistEnabled = await isFeatureEnabled("wishlist");
  const ordersEnabled = await isFeatureEnabled("orderTracking");

  const cards = [
    ordersEnabled && {
      href: "/orders",
      icon: Package,
      title: t("ordersTitle"),
      body: t("ordersBody"),
    },
    wishlistEnabled && {
      href: "/wishlist",
      icon: Heart,
      title: t("wishlistTitle"),
      body: t("wishlistBody"),
    },
    {
      href: "/dashboard",
      icon: UserCog,
      title: t("accountTitle"),
      body: t("accountBody"),
    },
  ].filter(Boolean) as { href: string; icon: typeof Package; title: string; body: string }[];

  return (
    <div className="container section-y">
      <h1 className="font-display text-2xl font-semibold">{t("welcome", { name })}</h1>
      {/* TODO (backlog): real account overview (profile, addresses, order history feed)
          once the backend account endpoints land — Phase 1 links to existing surfaces. */}
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((c) => (
          <Link key={c.href + c.title} href={c.href} className="group focus-visible:outline-none">
            <Card className="h-full transition-colors group-hover:border-accent group-focus-visible:border-accent">
              <CardHeader>
                <c.icon className="size-6 text-accent" aria-hidden="true" />
                <CardTitle className="mt-2 text-lg">{c.title}</CardTitle>
                <CardDescription>{c.body}</CardDescription>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
