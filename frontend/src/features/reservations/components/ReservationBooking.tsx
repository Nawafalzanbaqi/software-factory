import { getTranslations } from "next-intl/server";
import { reservationsApi } from "../api/reservationsApi";
import type { BranchDto } from "../types";
import { ReservationForm } from "./ReservationForm";

/**
 * Booking page body (Server Component). Fetches the branch list server-side (ISR)
 * and passes it to the client form leaf, then renders the page heading + intro
 * copy. Branch fetch failures degrade gracefully to an empty list so the page
 * still renders (the form surfaces the "no branches" state).
 */
async function fetchBranches(): Promise<BranchDto[]> {
  try {
    return await reservationsApi.listBranches();
  } catch {
    return [];
  }
}

export async function ReservationBooking() {
  const t = await getTranslations("reservations");
  const branches = await fetchBranches();

  return (
    <section
      aria-labelledby="reservation-page-heading"
      className="container section-y"
    >
      <div className="mx-auto max-w-2xl">
        <div className="mb-8 text-center">
          <h1
            id="reservation-page-heading"
            className="font-display text-3xl font-semibold sm:text-4xl"
          >
            {t("page.title")}
          </h1>
          <p className="mt-3 text-muted-foreground">{t("page.subtitle")}</p>
        </div>

        {branches.length === 0 ? (
          <p role="status" className="text-center text-muted-foreground">
            {t("page.noBranches")}
          </p>
        ) : (
          <ReservationForm branches={branches} />
        )}
      </div>
    </section>
  );
}
