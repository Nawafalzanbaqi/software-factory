import { getTranslations } from "next-intl/server";
import { ContactForm } from "./ContactForm";

/**
 * Contact Section (Server Component). Renders intro copy + the client form leaf.
 * Used both as the homepage "contact" section and as the body of /contact.
 *
 * Section gating is handled by the homepage composition (getEnabledSections in
 * HomeSections) — this feature has no dedicated feature flag, so the component
 * does not self-gate, matching HeroSection / PlaceholderSection.
 *
 * TODO (Payload agent + integrator): once src/lib/cms exposes
 * getContactContent(locale), source the title/subtitle from CMS with a graceful
 * fallback to these messages (see HeroSection for the pattern). Intentionally not
 * wired here because lib/cms is a shared file this feature must not edit and the
 * fetcher does not yet exist.
 */
export async function ContactSection({
  headingLevel = "h2",
}: {
  /** "h1" on the standalone /contact page, "h2" as a homepage section. */
  headingLevel?: "h1" | "h2";
} = {}) {
  const t = await getTranslations("contact");
  const Heading = headingLevel;

  return (
    <section
      id="contact"
      aria-labelledby="contact-heading"
      className="container section-y"
    >
      <div className="mx-auto max-w-2xl">
        <div className="mb-8 text-center">
          <Heading
            id="contact-heading"
            className="font-display text-2xl font-semibold sm:text-3xl"
          >
            {t("title")}
          </Heading>
          <p className="mt-3 text-muted-foreground">{t("subtitle")}</p>
        </div>
        <ContactForm />
      </div>
    </section>
  );
}
