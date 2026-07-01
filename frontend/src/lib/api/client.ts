/**
 * Typed fetch wrapper around the .NET backend REST API.
 *
 * Base URL comes from NEXT_PUBLIC_API_BASE_URL; every path is prefixed with the
 * versioned `/api/v1` route base from ARCHITECTURE.md §2. Supports Next.js fetch
 * cache/revalidate options so server components can opt into ISR per call.
 *
 * Usable from both Server Components (default) and Client Components.
 */

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:5080";
export const API_PREFIX = "/api/v1";

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public body?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export interface ApiRequestOptions extends Omit<RequestInit, "body"> {
  /** JSON-serializable request body. */
  body?: unknown;
  /** Query string params; undefined/null values are dropped. */
  query?: Record<string, string | number | boolean | undefined | null>;
  /** Next.js cache mode. Defaults to framework default. */
  cache?: RequestCache;
  /** Next.js ISR + tag options (revalidate seconds / cache tags). */
  next?: { revalidate?: number | false; tags?: string[] };
  /** Bearer token for authed endpoints (wishlist/orders). */
  token?: string;
}

function buildUrl(path: string, query?: ApiRequestOptions["query"]): string {
  const url = new URL(
    `${API_PREFIX}${path.startsWith("/") ? path : `/${path}`}`,
    API_BASE,
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

async function request<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
  const { body, query, token, headers, next, cache, ...rest } = options;

  const finalHeaders: Record<string, string> = {
    Accept: "application/json",
    ...(headers as Record<string, string>),
  };
  if (body !== undefined) finalHeaders["Content-Type"] = "application/json";
  if (token) finalHeaders["Authorization"] = `Bearer ${token}`;

  let response: Response;
  try {
    response = await fetch(buildUrl(path, query), {
      ...rest,
      headers: finalHeaders,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      ...(cache ? { cache } : {}),
      ...(next ? { next } : {}),
    });
  } catch (cause) {
    throw new ApiError(0, `Network error calling ${path}`, cause);
  }

  if (!response.ok) {
    let errorBody: unknown = undefined;
    try {
      errorBody = await response.json();
    } catch {
      /* non-JSON error body */
    }
    throw new ApiError(
      response.status,
      `Request to ${path} failed with ${response.status}`,
      errorBody,
    );
  }

  if (response.status === 204) return undefined as T;

  // Some endpoints (e.g. DELETE) may return empty bodies with 200.
  const text = await response.text();
  return (text ? JSON.parse(text) : undefined) as T;
}

export const apiClient = {
  get: <T>(path: string, options?: ApiRequestOptions) =>
    request<T>(path, { ...options, method: "GET" }),
  post: <T>(path: string, body?: unknown, options?: ApiRequestOptions) =>
    request<T>(path, { ...options, method: "POST", body }),
  put: <T>(path: string, body?: unknown, options?: ApiRequestOptions) =>
    request<T>(path, { ...options, method: "PUT", body }),
  delete: <T>(path: string, options?: ApiRequestOptions) =>
    request<T>(path, { ...options, method: "DELETE" }),
};

export type ApiClient = typeof apiClient;
