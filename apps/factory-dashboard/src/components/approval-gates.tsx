import { CheckCircle2, CircleDashed } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ApproveButton } from "@/components/approve-button";
import { GATE_DESCRIPTIONS, GATE_LABELS, GATE_TYPES } from "@/lib/phases";
import { formatDateTime } from "@/lib/utils";
import type { ApprovalGateDto, GateType } from "@/lib/platform-api";

/**
 * The 3 human approval gates (Architecture, Security, Deploy). Each shows its
 * status; unapproved gates render an approve action (client leaf). Approved
 * gates show who approved and when.
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
    <Card>
      <CardHeader>
        <CardTitle>Approval gates</CardTitle>
        <CardDescription>
          Three human sign-offs are required as the project moves through the
          pipeline.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="divide-y divide-border">
          {GATE_TYPES.map((gateType) => {
            const gate = byType.get(gateType);
            const approved = gate?.isApproved ?? false;
            return (
              <li
                key={gateType}
                className="flex flex-col gap-3 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex items-start gap-3">
                  {approved ? (
                    <CheckCircle2
                      className="mt-0.5 size-5 shrink-0 text-success"
                      aria-hidden="true"
                    />
                  ) : (
                    <CircleDashed
                      className="mt-0.5 size-5 shrink-0 text-muted-foreground"
                      aria-hidden="true"
                    />
                  )}
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{GATE_LABELS[gateType]}</span>
                      <Badge variant={approved ? "success" : "secondary"}>
                        {approved ? "Approved" : "Pending"}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {GATE_DESCRIPTIONS[gateType]}
                    </p>
                    {approved && gate && (
                      <p
                        className="text-xs text-muted-foreground"
                        data-testid={`gate-approved-${gateType}`}
                      >
                        Approved by{" "}
                        <span className="font-medium text-foreground">
                          {gate.approvedBy ?? "unknown"}
                        </span>{" "}
                        on {formatDateTime(gate.approvedAt)}
                      </p>
                    )}
                  </div>
                </div>
                {!approved && (
                  <ApproveButton projectId={projectId} gateType={gateType} />
                )}
              </li>
            );
          })}
        </ul>
      </CardContent>
    </Card>
  );
}
