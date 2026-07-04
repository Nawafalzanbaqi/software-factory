import "server-only";

import type { components } from "./platform-contract";

/**
 * Server-side typed client for the SoftwareFactory Platform API (PHASE3.md §1).
 *
 * This app embeds NO business logic — every read/write is a thin HTTP call to
 * the Platform REST API. The base URL comes from PLATFORM_API_BASE_URL and
 * defaults to http://localhost:5090. All calls run on the server (Server
 * Components, route handlers, server actions), never in the browser.
 *
 * Every DTO below is DERIVED from the platform's OpenAPI document
 * (src/lib/platform-contract.ts — regenerate with `npm run gen:platform-api`
 * while the platform runs locally). Never hand-write these shapes: a
 * hand-written mirror is how the dashboard previously drifted from the wire
 * format (enums are camelCase on the wire: "intake", "architecture", "success").
 */

const BASE_URL = process.env.PLATFORM_API_BASE_URL ?? "http://localhost:5090";
const API_PREFIX = "/api";

type Schemas = components["schemas"];

// ---- enums (camelCase JSON string values, per the contract) ----

export type ProjectPhase = Schemas["ProjectPhase"];
export type GateType = Schemas["GateType"];
export type DeploymentStatus = Schemas["DeploymentStatus"];
export type DeploymentSource = Schemas["DeploymentSource"];

// ---- response DTOs ----

export type ClientDto = Schemas["ClientDto"];
export type ProjectDto = Schemas["ProjectDto"];
export type ApprovalGateDto = Schemas["ApprovalGateDto"];
export type ApiUsageRecordDto = Schemas["ApiUsageRecordDto"];
export type DeploymentEventDto = Schemas["DeploymentEventDto"];

/** GET /api/projects/{id}/usage response. */
export type UsageResponseDto = Schemas["ProjectUsageDto"];

/** GET /api/projects/{id} — nested { project, gates[], usage, recentDeployments, intake?, optionsJson }. */
export type ProjectDetailDto = Schemas["ProjectDetailDto"];

export type AnalyticsTimeseriesPoint = Schemas["AnalyticsTimeseriesPointDto"];

/** GET /api/analytics/{projectId} — NoOp provider returns zeros/empty. */
export type AnalyticsDto = Schemas["AnalyticsDto"];

// ---- intake (the "New Project" flow) ----

/** GET /api/intake/catalog — everything the New Project form may offer. */
export type IntakeCatalogDto = Schemas["IntakeCatalogDto"];
export type IntakeSiteTypeDto = Schemas["IntakeSiteTypeDto"];
export type IntakeSectionOptionDto = Schemas["IntakeSectionOptionDto"];
export type ProjectIntakeDto = NonNullable<Schemas["ProjectIntakeDto"]>;

// ---- request bodies ----

export type RecordApprovalRequest = Schemas["CreateApprovalRequest"];
export type CreateDeploymentRequest = Schemas["CreateDeploymentRequest"];
export type CreateProjectRequest = Schemas["CreateProjectRequest"];
export type ProjectIntakeRequest = NonNullable<Schemas["ProjectIntakeRequest"]>;

// ---------------------------------------------------------------------------
// Transport
// ---------------------------------------------------------------------------

export class PlatformApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public body?: unknown,
  ) {
    super(message);
    this.name = "PlatformApiError";
  }
}

interface RequestOptions {
  method?: string;
  body?: unknown;
  query?: Record<string, string | number | boolean | undefined | null>;
  /** Next.js fetch cache mode. Reads default to no-store (live admin data). */
  cache?: RequestCache;
  next?: { revalidate?: number | false; tags?: string[] };
}

function buildUrl(path: string, query?: RequestOptions["query"]): string {
  const url = new URL(
    `${API_PREFIX}${path.startsWith("/") ? path : `/${path}`}`,
    BASE_URL,
  );
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined && value !== null && value !== "") {
        url.searchParams.set(key, String(value));
      }
    }
  }
  return url.toString();
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = "GET", body, query, cache = "no-store", next } = options;

  const headers: Record<string, string> = { Accept: "application/json" };
  if (body !== undefined) headers["Content-Type"] = "application/json";

  let response: Response;
  try {
    response = await fetch(buildUrl(path, query), {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      cache,
      ...(next ? { next } : {}),
    });
  } catch (cause) {
    throw new PlatformApiError(0, `Network error calling ${path}`, cause);
  }

  if (!response.ok) {
    let errorBody: unknown;
    try {
      errorBody = await response.json();
    } catch {
      /* non-JSON error body */
    }
    throw new PlatformApiError(
      response.status,
      `Platform API ${method} ${path} failed with ${response.status}`,
      errorBody,
    );
  }

  if (response.status === 204) return undefined as T;
  const text = await response.text();
  return (text ? JSON.parse(text) : undefined) as T;
}

// ---------------------------------------------------------------------------
// Typed endpoint surface (only what the dashboard consumes).
// ---------------------------------------------------------------------------

export const platformApi = {
  // Clients
  listClients: () => request<ClientDto[]>("/clients"),
  getClient: (id: string) => request<ClientDto>(`/clients/${id}`),
  listClientProjects: (id: string) =>
    request<ProjectDto[]>(`/clients/${id}/projects`),

  // Projects
  listProjects: () => request<ProjectDto[]>("/projects"),
  getProject: (id: string) => request<ProjectDetailDto>(`/projects/${id}`),
  createProject: (body: CreateProjectRequest) =>
    request<ProjectDto>("/projects", { method: "POST", body }),

  // Intake (the "New Project" flow)
  getIntakeCatalog: () => request<IntakeCatalogDto>("/intake/catalog"),

  // Approvals (the 3 human gates)
  recordApproval: (id: string, body: RecordApprovalRequest) =>
    request<ApprovalGateDto>(`/projects/${id}/approvals`, {
      method: "POST",
      body,
    }),

  // API cost / usage
  getUsage: (id: string) =>
    request<UsageResponseDto>(`/projects/${id}/usage`),

  // Deployments (created by the CI webhook)
  createDeployment: (id: string, body: CreateDeploymentRequest) =>
    request<DeploymentEventDto>(`/projects/${id}/deployments`, {
      method: "POST",
      body,
    }),

  // Analytics (NoOp placeholder — // TODO(phase-4): real Umami)
  getAnalytics: (projectId: string) =>
    request<AnalyticsDto>(`/analytics/${projectId}`),
};
