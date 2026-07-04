"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/lib/auth/config";
import {
  platformApi,
  PlatformApiError,
  type CreateProjectRequest,
} from "@/lib/platform-api";

export interface CreateProjectResult {
  ok: boolean;
  projectId?: string;
  error?: string;
}

/**
 * Structural re-check of the form payload. Semantic validation (valid
 * siteType/section combinations, core sections, allowed payment keys, …) is
 * the PLATFORM's job — it is the source of truth and rejects with a 400 whose
 * detail we surface back to the operator.
 */
const inputSchema = z.object({
  clientName: z.string().trim().min(1).max(200),
  clientContact: z.string().trim().min(1).max(320),
  projectName: z.string().trim().min(1).max(200),
  siteType: z.string().trim().min(1).max(100),
  language: z.string().trim().min(1).max(10),
  designDirection: z.string().trim().min(1).max(50),
  sections: z.array(z.string().trim().min(1)).min(1),
  payments: z.array(z.string().trim().min(1)),
  integrations: z.array(z.string().trim().min(1)),
  features: z.array(z.string().trim().min(1)),
  notes: z.string().max(2000),
});

export type NewProjectInput = z.infer<typeof inputSchema>;

/** Extracts the ProblemDetails `detail` (the platform's validation messages). */
function problemDetail(body: unknown): string | undefined {
  if (body && typeof body === "object" && "detail" in body) {
    const detail = (body as { detail?: unknown }).detail;
    if (typeof detail === "string" && detail.length > 0) return detail;
  }
  return undefined;
}

/**
 * Server action: register a new client project from the intake form. Forwards
 * to POST /api/projects on the platform (which validates, resolves/creates the
 * client, persists the IntakeSpec and generates options.json).
 */
export async function createProjectAction(
  input: NewProjectInput,
): Promise<CreateProjectResult> {
  const session = await auth();
  if (!session?.user?.email) {
    return { ok: false, error: "Not authenticated." };
  }

  const parsed = inputSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Please complete all required fields." };
  }
  const data = parsed.data;

  const body: CreateProjectRequest = {
    clientId: null,
    name: data.projectName,
    siteType: data.siteType,
    repoUrl: null,
    branch: null,
    intake: {
      clientName: data.clientName,
      clientContact: data.clientContact,
      language: data.language,
      designDirection: data.designDirection,
      sections: data.sections,
      payments: data.payments,
      integrations: data.integrations,
      features: data.features,
      notes: data.notes.trim() || null,
    },
  };

  try {
    const created = await platformApi.createProject(body);
    revalidatePath("/projects");
    return { ok: true, projectId: created.id };
  } catch (error) {
    if (error instanceof PlatformApiError && error.status === 400) {
      return {
        ok: false,
        error: problemDetail(error.body) ?? "The platform rejected the intake data.",
      };
    }
    return { ok: false, error: "Failed to create the project. Try again." };
  }
}
