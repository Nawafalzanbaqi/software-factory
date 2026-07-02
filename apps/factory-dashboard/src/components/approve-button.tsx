"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { approveGate } from "@/app/(dashboard)/projects/[id]/actions";
import type { GateType } from "@/lib/platform-api";

/**
 * Interactive leaf: approve a single gate. Calls the `approveGate` server
 * action (which records who/when via the Platform API), then refreshes so the
 * gate reflects as approved.
 */
export function ApproveButton({
  projectId,
  gateType,
}: {
  projectId: string;
  gateType: GateType;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleApprove() {
    setError(null);
    startTransition(async () => {
      const result = await approveGate(projectId, gateType);
      if (!result.ok) {
        setError(result.error ?? "Something went wrong.");
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <Button
        type="button"
        size="sm"
        onClick={handleApprove}
        disabled={isPending}
        data-testid={`approve-${gateType}`}
      >
        {isPending ? "Approving…" : "Approve"}
      </Button>
      {error && (
        <p role="alert" className="text-xs text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
