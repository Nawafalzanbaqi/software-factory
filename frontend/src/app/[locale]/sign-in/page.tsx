import type { Metadata } from "next";
import { setRequestLocale, getTranslations } from "next-intl/server";
import type { Locale } from "@/lib/i18n/routing";
import { buildMetadata } from "@/lib/seo/metadata";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { SignInForm } from "@/components/auth/SignInForm";

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

/**
 * Open-redirect guard: only same-site relative paths may be used as the
 * post-sign-in destination ("/foo", not "//evil.com" or "https://...").
 */
function safeCallbackUrl(raw: string | string[] | undefined): string | undefined {
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (value && value.startsWith("/") && !value.startsWith("//")) return value;
  return undefined;
}

/** Self-hosted Auth.js sign-in screen (authConfig.pages.signIn = "/sign-in"). */
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
