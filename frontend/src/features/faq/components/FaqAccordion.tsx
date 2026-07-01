"use client";

import type { FaqEntry } from "../types";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "./Accordion";

/**
 * Presentational FAQ list (interactive client leaf). Renders localized entries as
 * a single-open, collapsible accordion. Copy is passed in (from CMS or i18n
 * fallback) — nothing is hardcoded here.
 *
 * TODO (backlog): wire analytics (features.analytics) to emit an "faq_expand"
 * event with the question id on value change.
 */
export function FaqAccordion({ entries }: { entries: FaqEntry[] }) {
  if (entries.length === 0) return null;

  return (
    <Accordion
      type="single"
      collapsible
      className="w-full rounded-lg border bg-card shadow-premium"
    >
      {entries.map((entry) => (
        <AccordionItem key={entry.id} value={entry.id}>
          <AccordionTrigger>{entry.question}</AccordionTrigger>
          <AccordionContent>{entry.answer}</AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
