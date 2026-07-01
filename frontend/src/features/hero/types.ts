import type { HeroContent } from "@/lib/cms/types";

export type { HeroContent };

/** Props accepted by the Hero Section (all optional; falls back to i18n copy). */
export interface HeroSectionProps {
  content?: HeroContent | null;
}
