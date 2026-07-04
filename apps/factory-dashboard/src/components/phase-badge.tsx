import { Badge } from "@/components/ui/badge";
import { PHASE_LABELS, PROJECT_PHASES } from "@/lib/phases";
import type { ProjectPhase } from "@/lib/platform-api";

/**
 * Compact status chip showing a project's current phase with its position in
 * the 7-phase pipeline (e.g. "Build 4/7"). In-flight projects read as live
 * (neon chip); projects in Operate read as settled (green).
 */
export function PhaseBadge({ phase }: { phase: ProjectPhase }) {
  const index = PROJECT_PHASES.indexOf(phase);
  const position = index >= 0 ? `${index + 1}/${PROJECT_PHASES.length}` : "?";
  const isOperate = phase === "operate";
  return (
    <Badge variant={isOperate ? "success" : "default"} className="font-mono">
      {/* Explicit space keeps the text layer readable ("Build 4/7"), while the
          badge's flex gap provides the visual spacing. */}
      {PHASE_LABELS[phase] ?? phase}{" "}
      <span className="opacity-70">{position}</span>
    </Badge>
  );
}
