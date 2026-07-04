import type { GateType, ProjectPhase } from "@/lib/platform-api";

/**
 * The 7 factory phases in pipeline order. Values are the WIRE values from the
 * platform contract (camelCase, e.g. "intake" — see platform-contract.ts);
 * PHASE_LABELS carries the display casing. Keeping these separate is what
 * stops the UI from drifting from the JSON enum serialization again.
 */
export const PROJECT_PHASES: readonly ProjectPhase[] = [
  "intake",
  "foundation",
  "generation",
  "build",
  "harden",
  "ship",
  "operate",
] as const;

/** Display names for the pipeline / badges. */
export const PHASE_LABELS: Record<ProjectPhase, string> = {
  intake: "Intake",
  foundation: "Foundation",
  generation: "Generation",
  build: "Build",
  harden: "Harden",
  ship: "Ship",
  operate: "Operate",
};

/** The 3 human approval gates (ARCHITECTURE.md) in the order they occur — wire values. */
export const GATE_TYPES: readonly GateType[] = [
  "architecture",
  "security",
  "deploy",
] as const;

export const GATE_LABELS: Record<GateType, string> = {
  architecture: "Architecture",
  security: "Security",
  deploy: "Deploy",
};

/** Short description of what each gate authorizes, for the UI. */
export const GATE_DESCRIPTIONS: Record<GateType, string> = {
  architecture: "Approve the proposed architecture before generation begins.",
  security: "Sign off on the security hardening pass before shipping.",
  deploy: "Authorize the production deployment.",
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
