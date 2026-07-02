import "server-only";

/**
 * Server-side typed client for the SoftwareFactory Platform API (PHASE3.md §1).
 *
 * This app embeds NO business logic — every read/write is a thin HTTP call to
 * the Platform REST API. The base URL comes from PLATFORM_API_BASE_URL and
 * defaults to http://localhost:5090. All calls run on the server (Server
 * Components, route handlers, server actions), never in the browser.
 *
 * DTOs below mirror the Platform API §1 response shapes exactly.
 */

const BASE_URL = process.env.PLATFORM_API_BASE_URL ?? "http://localhost:5090";
const API_PREFIX = "/api";

// ---------------------------------------------------------------------------
// Enums (JSON string values). See PHASE3.md §1 "Enums".
// ---------------------------------------------------------------------------

export type ProjectPhase =
  | "Intake"
  | "Foundation"
  | "Generation"
  | "Build"
  | "Harden"
  | "Ship"
  | "Operate";

export type GateType = "Architecture" | "Security" | "Deploy";

export type DeploymentStatus = "Pending" | "Success" | "Failure";

/** JSON serialization is lower-case: "ci" | "manual". */
export type DeploymentSource = "ci" | "manual";

// ---------------------------------------------------------------------------
// DTOs (mirror PHASE3.md §1 responses).
// ---------------------------------------------------------------------------

export interface ClientDto {
  id: string;
  name: string;
  contactEmail?: string | null;
  notes?: string | null;
  createdAt: string;
}

export interface ProjectDto {
  id: string;
  clientId: string;
  name: string;
  siteType: string;
  currentPhase: ProjectPhase;
  repoUrl?: string | null;
  branch?: string | null;
  liveUrl?: string | null;
  createdAt: string;
}

export interface ApprovalGateDto {
  id: string;
  projectId: string;
  gateType: GateType;
  approvedBy?: string | null;
  approvedAt?: string | null;
  notes?: string | null;
  isApproved: boolean;
}

export interface ApiUsageRecordDto {
  id: string;
  projectId: string;
  model: string;
  tokens: number;
  costUsd: number;
  recordedAt: string;
}

export interface DeploymentEventDto {
  id: string;
  projectId: string;
  status: DeploymentStatus;
  source: DeploymentSource;
  payload: string;
  occurredAt: string;
}

/** GET /api/projects/{id}/usage response. */
export interface UsageResponseDto {
  records: ApiUsageRecordDto[];
  totalCostUsd: number;
  totalTokens: number;
}

/**
 * GET /api/projects/{id} — the Platform API returns a NESTED shape:
 * { project, gates[], usage, recentDeployments }. Must match
 * SoftwareFactory.Platform.Application.Dtos.ProjectDetailDto exactly.
 */
export interface ProjectDetailDto {
  project: ProjectDto;
  gates: ApprovalGateDto[];
  usage: UsageResponseDto;
  recentDeployments: DeploymentEventDto[];
}

/** One point of the analytics timeseries (matches AnalyticsTimeseriesPointDto). */
export interface AnalyticsTimeseriesPoint {
  date: string;
  visitors: number;
  pageViews: number;
}

/** GET /api/analytics/{projectId} — NoOp provider returns zeros/empty. */
export interface AnalyticsDto {
  projectId: string;
  provider: string; // "noop" until real Umami — // TODO(phase-4)
  visitors: number;
  pageViews: number;
  bounceRate: number;
  timeseries: AnalyticsTimeseriesPoint[];
}

// ---- request bodies ----

export interface RecordApprovalRequest {
  gateType: GateType;
  approvedBy: string;
  notes?: string;
}

export interface CreateDeploymentRequest {
  status: DeploymentStatus;
  source: DeploymentSource;
  payload: string;
}

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
