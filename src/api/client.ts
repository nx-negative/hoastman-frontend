import { API_BASE } from "@/config"
import { getAdminToken } from "@/store/auth"

import type { ZodType } from "zod"
import { errorBodySchema } from "./schemas"

/**
 * Normalized API failure (§9): every error surface gets {status, code, message}.
 * `status` 0 = network-level failure; codes come from the backend's error list
 * (docs/backend-api/README.md) plus client-side synthesis below. Messages never
 * include backend hosts or internals (§2.12).
 */
export class ApiError extends Error {
  readonly status: number
  readonly code: string

  constructor(status: number, code: string, message: string) {
    super(message)
    this.name = "ApiError"
    this.status = status
    this.code = code
  }
}

// §9/§24 retry policy: transient failures only — network, 408, 429, 503
// (503 = rate limiting/overload semantics on this backend). 4xx and 500 are
// permanent from the client's perspective and never retried.
const RETRYABLE_STATUSES = new Set([0, 408, 429, 503])

export function isRetryable(error: unknown): boolean {
  return error instanceof ApiError && RETRYABLE_STATUSES.has(error.status)
}

/** Capped exponential backoff: 500ms → 1s → 2s (frontend-guide §24). */
export function retryDelay(attempt: number): number {
  return Math.min(2000, 500 * 2 ** attempt)
}

async function toApiError(response: Response): Promise<ApiError> {
  let code = "unknown"
  let message = "Request failed"
  try {
    const body = errorBodySchema.parse((await response.json()).error)
    code = body.code
    message = body.message
  } catch {
    // Non-JSON or malformed error body — keep the generic fallback.
  }
  return new ApiError(response.status, code, message)
}

/**
 * The single fetch wrapper (§9). All API calls go through here; components
 * never call fetch directly. Returns the parsed JSON body (validated further
 * by endpoint modules via `parseWith`).
 */
export async function apiFetch(
  path: string,
  init?: Omit<RequestInit, "headers"> & { headers?: Record<string, string> }
): Promise<unknown> {
  const headers: Record<string, string> = { ...init?.headers }
  if (init?.body) headers["content-type"] = "application/json"
  // §9: admin token in memory only, sent as X-Admin-Token.
  const token = getAdminToken()
  if (token) headers["X-Admin-Token"] = token

  let response: Response
  try {
    response = await fetch(`${API_BASE}${path}`, { ...init, headers })
  } catch {
    throw new ApiError(0, "network_error", "Network error — backend unreachable")
  }

  if (!response.ok) throw await toApiError(response)

  try {
    return await response.json()
  } catch {
    throw new ApiError(200, "invalid_response", "Malformed response body")
  }
}

/** Runtime gate (§9): parse-and-validate a response before it reaches the UI. */
export function parseWith<T>(schema: ZodType<T>, data: unknown): T {
  const result = schema.safeParse(data)
  if (!result.success) {
    throw new ApiError(200, "invalid_response", "Response failed validation")
  }
  return result.data
}
