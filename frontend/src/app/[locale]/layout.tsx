import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations, setRequestLocale } from "next-intl/server";
import { Inter, Playfair_Display } from "next/font/google";
import { routing, getDirection, isLocale, type Locale } from "@/lib/i18n/routing";
import { Header, Footer } from "@/components/layout";
import { AuthProvider } from "@/components/providers/AuthProvider";
import { Toaster } from "@/components/ui/sonner";
import { buildMetadata } from "@/lib/seo/metadata";
import { buildOrganizationJsonLd } from "@/lib/seo/jsonld";
import { JsonLd } from "@/lib/seo/json-ld";
import { getSiteConfig } from "@/lib/config/options";
import "@/app/globals.css";

const fontSans = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});
const fontDisplay = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

/** Pre-render both locales at build time (SSG). */
export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "hero" });
  const tc = await getTranslations({ locale, namespace: "common" });
  return buildMetadata({
    locale,
    title: `${tc("brand")} — ${t("title")}`,
    description: t("subtitle"),
    path: "/",
  });
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) {
    notFound();
  }
  // Enable static rendering for this locale.
  setRequestLocale(locale);

  const dir = getDirection(locale);
  const site = await getSiteConfig();
  const messages = await getMessages();
  const tc = await getTranslations({ locale, namespace: "common" });

  const orgJsonLd = buildOrganizationJsonLd({ name: site.siteName });

  return (
    <html
      lang={locale}
      dir={dir}
      className={`${fontSans.variable} ${fontDisplay.variable}`}
      suppressHydrationWarning
    >
      <body className="flex min-h-dvh flex-col font-sans">
        <NextIntlClientProvider messages={messages}>
          <AuthProvider>
            <a href="#main-content" className="skip-link">
              {tc("skipToContent")}
            </a>
            <Header />
            <main id="main-content" tabIndex={-1} className="flex-1 focus-visible:outline-none">
              {children}
            </main>
            <Footer />
            <Toaster />
          </AuthProvider>
        </NextIntlClientProvider>
        <JsonLd data={orgJsonLd} />
      </body>
    </html>
  );
}
