import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { PHASE_LABELS, PROJECT_PHASES, phaseState } from "@/lib/phases";
import type { ProjectPhase } from "@/lib/platform-api";

/**
 * The 7-phase pipeline as a stepper: completed phases are filled with a
 * check, the current phase carries the neon glow (a soft pulse, disabled
 * under prefers-reduced-motion via motion-safe:), upcoming phases are muted
 * outlines. Horizontal on md+ with connector lines, stacked on mobile.
 * Rendered server-side (no interactivity).
 */
export function PhasePipeline({ currentPhase }: { currentPhase: ProjectPhase }) {
  return (
    <ol
      className="flex flex-col gap-4 md:flex-row md:gap-0"
      aria-label="Project pipeline phases"
    >
      {PROJECT_PHASES.map((phase, index) => {
        const state = phaseState(phase, currentPhase);
        const isLast = index === PROJECT_PHASES.length - 1;
        return (
          <li
            key={phase}
            aria-current={state === "current" ? "step" : undefined}
            className={cn(
              "relative flex items-center gap-3 md:flex-1 md:flex-col md:gap-2.5 md:text-center",
              // Connector to the next node (md+): a hairline that turns
              // green once this phase is done.
              !isLast &&
                "md:after:absolute md:after:top-[17px] md:after:h-px md:after:content-[''] md:after:start-[calc(50%+26px)] md:after:end-[calc(-50%+26px)]",
              !isLast && (state === "done" ? "md:after:bg-success/50" : "md:after:bg-border"),
            )}
          >
            <span
              className={cn(
                "flex size-9 shrink-0 items-center justify-center rounded-full border font-mono text-xs font-semibold transition-colors",
                state === "done" &&
                  "border-success bg-success text-success-foreground",
                state === "current" &&
                  "border-primary bg-primary/15 text-primary shadow-glow-primary motion-safe:animate-phase-pulse",
                state === "upcoming" &&
                  "border-border bg-transparent text-muted-foreground",
              )}
            >
              {state === "done" ? (
                <Check className="size-4" aria-hidden="true" />
              ) : (
                index + 1
              )}
            </span>
            <span
              className={cn(
                "font-mono text-xs uppercase tracking-wider",
                state === "current" ? "text-foreground" : "text-muted-foreground",
              )}
            >
              {PHASE_LABELS[phase]}
              <span className="sr-only">
                {state === "done"
                  ? " (completed)"
                  : state === "current"
                    ? " (current phase)"
                    : " (upcoming)"}
              </span>
            </span>
          </li>
        );
      })}
    </ol>
  );
}
