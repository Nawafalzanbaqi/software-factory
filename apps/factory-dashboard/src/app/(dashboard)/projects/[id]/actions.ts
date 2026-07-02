"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth/config";
import { platformApi, type GateType } from "@/lib/platform-api";

export interface ApproveGateResult {
  ok: boolean;
  error?: string;
}

const VALID_GATES: GateType[] = ["Architecture", "Security", "Deploy"];

/**
 * Server action: record an approval for one of the 3 human gates.
 *
 * Records WHO (the signed-in admin's email) and WHEN (server-side, via the
 * Platform API) — no business logic lives here, it just forwards to
 * POST /api/projects/{id}/approvals and revalidates the detail page so the
 * change is reflected.
 */
export async function approveGate(
  projectId: string,
  gateType: GateType,
  notes?: string,
): Promise<ApproveGateResult> {
  const session = await auth();
  const approvedBy = session?.user?.email;
  if (!approvedBy) {
    return { ok: false, error: "Not authenticated." };
  }
  if (!VALID_GATES.includes(gateType)) {
    return { ok: false, error: "Unknown gate type." };
  }

  try {
    await platformApi.recordApproval(projectId, {
      gateType,
      approvedBy,
      notes: notes?.trim() || undefined,
    });
  } catch {
    return { ok: false, error: "Failed to record approval. Try again." };
  }

  revalidatePath(`/projects/${projectId}`);
  return { ok: true };
}
