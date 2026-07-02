import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import {
  platformApi,
  PlatformApiError,
  type CreateDeploymentRequest,
} from "@/lib/platform-api";

/**
 * POST /api/webhooks/ci
 *
 * GitHub Actions calls this on job completion. Authentication is a SHARED SECRET
 * header (X-Webhook-Secret == env CI_WEBHOOK_SECRET), NOT OAuth. On a valid
 * secret we forward to the Platform API as a DeploymentEvent
 * (POST /api/projects/{id}/deployments). Bad/absent secret → 401.
 *
 * This route is excluded from the auth middleware matcher (secret-authed).
 */

// GitHub Actions conclusions → DeploymentStatus (PHASE3.md §1).
const conclusionToStatus: Record<string, CreateDeploymentRequest["status"]> = {
  success: "Success",
  failure: "Failure",
  cancelled: "Failure",
  timed_out: "Failure",
  action_required: "Pending",
  neutral: "Pending",
  skipped: "Pending",
};

const bodySchema = z.object({
  projectId: z.string().min(1),
  // Either an explicit status or a raw GitHub Actions conclusion.
  status: z.enum(["Pending", "Success", "Failure"]).optional(),
  conclusion: z.string().optional(),
  // Free-form CI context stored as the DeploymentEvent payload (jsonb string).
  payload: z.unknown().optional(),
});

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return mismatch === 0;
}

export async function POST(request: NextRequest) {
  const expected = process.env.CI_WEBHOOK_SECRET;
  const provided = request.headers.get("x-webhook-secret");

  // Missing server config, or missing/wrong secret → 401. Never leak details.
  if (!expected || !provided || !timingSafeEqual(provided, expected)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid payload", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { projectId, status, conclusion, payload } = parsed.data;
  const resolvedStatus =
    status ??
    (conclusion ? (conclusionToStatus[conclusion.toLowerCase()] ?? "Pending") : "Pending");

  const deployment: CreateDeploymentRequest = {
    status: resolvedStatus,
    source: "ci",
    payload: typeof payload === "string" ? payload : JSON.stringify(payload ?? json),
  };

  try {
    const created = await platformApi.createDeployment(projectId, deployment);
    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    const upstream = error instanceof PlatformApiError ? error.status : 0;
    const outStatus = upstream >= 400 && upstream < 600 ? upstream : 502;
    return NextResponse.json(
      { error: "Failed to record deployment event" },
      { status: outStatus },
    );
  }
}
