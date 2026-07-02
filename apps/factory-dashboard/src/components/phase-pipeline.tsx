import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { PROJECT_PHASES, phaseState } from "@/lib/phases";
import type { ProjectPhase } from "@/lib/platform-api";

/**
 * Visual 7-phase pipeline: Intake → Foundation → Generation → Build → Harden →
 * Ship → Operate. The current phase is highlighted; done phases are checked and
 * muted; upcoming phases are dimmed. Rendered server-side (no interactivity).
 */
export function PhasePipeline({ currentPhase }: { currentPhase: ProjectPhase }) {
  return (
    <ol
      className="flex flex-col gap-3 md:flex-row md:items-stretch md:gap-2"
      aria-label="Project pipeline phases"
    >
      {PROJECT_PHASES.map((phase, index) => {
        const state = phaseState(phase, currentPhase);
        const isLast = index === PROJECT_PHASES.length - 1;
        return (
          <li
            key={phase}
            aria-current={state === "current" ? "step" : undefined}
            className="flex flex-1 items-center gap-2 md:flex-col md:gap-2 md:text-center"
          >
            <div className="flex items-center gap-2 md:w-full md:flex-col">
              <span
                className={cn(
                  "flex size-8 shrink-0 items-center justify-center rounded-full border text-xs font-semibold transition-colors",
                  state === "done" &&
                    "border-success bg-success text-success-foreground",
                  state === "current" &&
                    "border-primary bg-primary text-primary-foreground ring-2 ring-primary/40",
                  state === "upcoming" &&
                    "border-border bg-muted text-muted-foreground",
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
                  "text-sm font-medium",
                  state === "current" && "text-foreground",
                  state !== "current" && "text-muted-foreground",
                )}
              >
                {phase}
                <span className="sr-only">
                  {state === "done"
                    ? " (completed)"
                    : state === "current"
                      ? " (current phase)"
                      : " (upcoming)"}
                </span>
              </span>
            </div>
            {!isLast && (
              <span
                aria-hidden="true"
                className={cn(
                  "hidden h-0.5 flex-1 self-center md:block",
                  state === "done" ? "bg-success" : "bg-border",
                )}
              />
            )}
          </li>
        );
      })}
    </ol>
  );
}
