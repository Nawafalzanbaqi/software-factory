import { getTranslations } from "next-intl/server";
import { isSectionEnabled } from "@/lib/config/options";
import { Button } from "@/components/ui/button";
import { Link } from "@/lib/i18n/navigation";

/**
 * Reservation homepage Section (Server Component). A short CTA block that links to
 * the /reservations booking page — the actual form lives there, not on the home
 * page. Self-gates: returns null when the `reservation` section is disabled in the
 * active options file, matching the "Section returns null when disabled" contract
 * (HomeSections only mounts it for the restaurant vertical anyway).
 */
export async function ReservationSection() {
  if (!(await isSectionEnabled("reservation"))) return null;

  const t = await getTranslations("reservations");

  return (
    <section
      id="reservation"
      aria-labelledby="reservation-heading"
      className="container section-y"
    >
      <div className="mx-auto max-w-2xl rounded-xl border border-input bg-muted/30 p-8 text-center sm:p-12">
        <h2
          id="reservation-heading"
          className="font-display text-2xl font-semibold sm:text-3xl"
        >
          {t("cta.title")}
        </h2>
        <p className="mx-auto mt-3 max-w-prose text-muted-foreground">
          {t("cta.subtitle")}
        </p>
        <Button asChild size="lg" className="mt-6">
          <Link href="/reservations">{t("cta.action")}</Link>
        </Button>
      </div>
    </section>
  );
}
