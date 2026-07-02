import type { GateType, ProjectPhase } from "@/lib/platform-api";

/**
 * The 7 factory phases in pipeline order (PHASE3.md §1 ProjectPhase enum).
 * Used by the visual pipeline to compute done/current/upcoming states.
 */
export const PROJECT_PHASES: readonly ProjectPhase[] = [
  "Intake",
  "Foundation",
  "Generation",
  "Build",
  "Harden",
  "Ship",
  "Operate",
] as const;

/** The 3 human approval gates (ARCHITECTURE.md) in the order they occur. */
export const GATE_TYPES: readonly GateType[] = [
  "Architecture",
  "Security",
  "Deploy",
] as const;

/** Short description of what each gate authorizes, for the UI. */
export const GATE_DESCRIPTIONS: Record<GateType, string> = {
  Architecture: "Approve the proposed architecture before generation begins.",
  Security: "Sign off on the security hardening pass before shipping.",
  Deploy: "Authorize the production deployment.",
};

export type PhaseState = "done" | "current" | "upcoming";

/** Position of a phase relative to the project's current phase. */
export function phaseState(
  phase: ProjectPhase,
  currentPhase: ProjectPhase,
): PhaseState {
  const index = PROJECT_PHASES.indexOf(phase);
  const currentIndex = PROJECT_PHASES.indexOf(currentPhase);
  if (index < currentIndex) return "done";
  if (index === currentIndex) return "current";
  return "upcoming";
}
