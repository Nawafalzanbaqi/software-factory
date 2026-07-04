import { CheckCircle2, DraftingCompass, Rocket, ShieldCheck } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ApproveButton } from "@/components/approve-button";
import { GATE_DESCRIPTIONS, GATE_LABELS, GATE_TYPES } from "@/lib/phases";
import { formatDateTime } from "@/lib/utils";
import type { ApprovalGateDto, GateType } from "@/lib/platform-api";
import type { LucideIcon } from "lucide-react";

const GATE_ICONS: Record<GateType, LucideIcon> = {
  architecture: DraftingCompass,
  security: ShieldCheck,
  deploy: Rocket,
};

/**
 * The 3 human approval gates (Architecture, Security, Deploy) as distinct
 * cards: pending gates are amber-edged with a prominent Approve action,
 * approved gates settle to green with who/when. Approve is a client leaf.
 */
export function ApprovalGates({
  projectId,
  gates,
}: {
  projectId: string;
  gates: ApprovalGateDto[];
}) {
  const byType = new Map<GateType, ApprovalGateDto>();
  for (const gate of gates) byType.set(gate.gateType, gate);

  return (
    <section aria-labelledby="approval-gates-heading" className="space-y-4">
      <div className="space-y-1">
        <h2
          id="approval-gates-heading"
          className="text-lg font-semibold leading-tight tracking-tight"
        >
          Approval gates
        </h2>
        <p className="text-sm text-muted-foreground">
          Three human sign-offs are required as the project moves through the
          pipeline.
        </p>
      </div>
      <ul className="grid gap-4 md:grid-cols-3">
        {GATE_TYPES.map((gateType) => {
          const gate = byType.get(gateType);
          const approved = gate?.isApproved ?? false;
          const Icon = GATE_ICONS[gateType];
          return (
            <li key={gateType}>
              <Card
                className={cnGate(approved)}
              >
                <CardHeader className="flex-row items-start justify-between space-y-0 pb-3">
                  <span
                    className={
                      approved
                        ? "flex size-9 items-center justify-center rounded-md border border-success/30 bg-success/10 text-success"
                        : "flex size-9 items-center justify-center rounded-md border border-warning/30 bg-warning/10 text-warning"
                    }
                  >
                    <Icon className="size-4" aria-hidden="true" />
                  </span>
                  <Badge variant={approved ? "success" : "warning"}>
                    {approved ? "Approved" : "Pending"}
                  </Badge>
                </CardHeader>
                <CardContent className="flex flex-1 flex-col gap-3">
                  <div className="space-y-1">
                    <CardTitle className="text-base">
                      {GATE_LABELS[gateType]}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {GATE_DESCRIPTIONS[gateType]}
                    </p>
                  </div>
                  <div className="mt-auto pt-1">
                    {approved && gate ? (
                      <p
                        className="flex items-start gap-1.5 text-xs text-muted-foreground"
                        data-testid={`gate-approved-${gateType}`}
                      >
                        <CheckCircle2
                          className="mt-0.5 size-3.5 shrink-0 text-success"
                          aria-hidden="true"
                        />
                        <span>
                          Approved by{" "}
                          <span className="font-mono text-foreground">
                            {gate.approvedBy ?? "unknown"}
                          </span>{" "}
                          on {formatDateTime(gate.approvedAt)}
                        </span>
                      </p>
                    ) : (
                      <ApproveButton projectId={projectId} gateType={gateType} />
                    )}
                  </div>
                </CardContent>
              </Card>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

/** Pending gates carry a faint amber edge; approved gates settle to green. */
function cnGate(approved: boolean): string {
  return approved
    ? "flex h-full flex-col border-success/25"
    : "flex h-full flex-col border-warning/25";
}
