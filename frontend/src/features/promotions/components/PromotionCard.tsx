import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { Link } from "@/lib/i18n/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import type { Locale } from "@/lib/i18n/routing";
import type { PromotionView } from "../types";

/**
 * Server Component offer card: image, title, subcopy, valid-until, CTA.
 * Presentational only — no client JS. The whole card links to the offer when a
 * destination exists; the CTA button is a nested affordance (styled span, not a
 * nested <a>) so we stay valid HTML while keeping one accessible link per card.
 */
export async function PromotionCard({
  promotion,
  locale,
}: {
  promotion: PromotionView;
  locale: Locale;
}) {
  const t = await getTranslations("promotions");
  const ctaLabel = promotion.ctaLabel ?? t("cta");

  const validUntil = promotion.validUntil
    ? new Intl.DateTimeFormat(locale === "ar" ? "ar" : "en", {
        year: "numeric",
        month: "long",
        day: "numeric",
      }).format(new Date(promotion.validUntil))
    : undefined;

  const body = (
    <Card className="group flex h-full flex-col overflow-hidden transition-shadow hover:shadow-premium">
      {promotion.image && (
        <div className="relative aspect-[16/9] overflow-hidden bg-muted">
          <Image
            src={promotion.image.url}
            alt={promotion.image.alt}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        </div>
      )}
      <CardContent className="flex flex-1 flex-col gap-2 p-5">
        <h3 className="font-display text-lg font-semibold">{promotion.title}</h3>
        {promotion.subtitle && (
          <p className="text-sm text-muted-foreground">{promotion.subtitle}</p>
        )}
        {validUntil && (
          <p className="mt-auto pt-2 text-xs font-medium text-muted-foreground">
            {t("validUntil", { date: validUntil })}
          </p>
        )}
        {promotion.href && (
          <span
            aria-hidden="true"
            className={`${buttonVariants({ variant: "secondary", size: "sm" })} w-fit ${
              validUntil ? "mt-2" : "mt-auto"
            }`}
          >
            {ctaLabel}
          </span>
        )}
      </CardContent>
    </Card>
  );

  if (!promotion.href) {
    return <li className="h-full list-none">{body}</li>;
  }

  return (
    <li className="h-full list-none">
      <Link
        href={promotion.href}
        className="block h-full rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        aria-label={`${promotion.title} — ${ctaLabel}`}
      >
        {body}
      </Link>
    </li>
  );
}
