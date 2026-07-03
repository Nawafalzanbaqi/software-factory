import type { Metadata } from "next";
import { setRequestLocale, getTranslations } from "next-intl/server";
import type { Locale } from "@/lib/i18n/routing";
import { buildMetadata } from "@/lib/seo/metadata";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { SignInForm } from "@/components/auth/SignInForm";
import { safeCallbackUrl } from "@/lib/auth/callback-url";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "signIn" });
  // Auth screens are not indexed.
  return buildMetadata({
    locale,
    title: t("title"),
    description: t("subtitle"),
    path: "/sign-in",
    noIndex: true,
  });
}

/** Self-hosted Auth.js sign-in screen (authConfig.pages.signIn = "/sign-in").
 * The callbackUrl search param passes the structural open-redirect guard in
 * lib/auth/callback-url.ts (audit fix #5) before reaching the form. */
export default async function SignInPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: Locale }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("signIn");
  const callbackUrl = safeCallbackUrl((await searchParams).callbackUrl);

  return (
    <div className="container flex min-h-[70vh] items-center justify-center section-y">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="font-display text-2xl">{t("title")}</CardTitle>
          <CardDescription>{t("subtitle")}</CardDescription>
        </CardHeader>
        <CardContent>
          <SignInForm callbackUrl={callbackUrl} />
        </CardContent>
      </Card>
    </div>
  );
}
