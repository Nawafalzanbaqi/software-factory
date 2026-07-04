import { Badge } from "@/components/ui/badge";
import { PHASE_LABELS, PROJECT_PHASES } from "@/lib/phases";
import type { ProjectPhase } from "@/lib/platform-api";

/**
 * Compact badge showing a project's current phase with its position in the
 * 7-phase pipeline (e.g. "Build (4/7)"). Used in the project lists.
 */
export function PhaseBadge({ phase }: { phase: ProjectPhase }) {
  const index = PROJECT_PHASES.indexOf(phase);
  const position = index >= 0 ? `${index + 1}/${PROJECT_PHASES.length}` : "?";
  const isOperate = phase === "operate";
  return (
    <Badge variant={isOperate ? "success" : "secondary"}>
      {PHASE_LABELS[phase] ?? phase} · {position}
    </Badge>
  );
}
