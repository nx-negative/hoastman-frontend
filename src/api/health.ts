import { apiFetch, parseWith } from "./client"
import {
  readinessSchema,
  statusSchema,
  systemHealthSchema,
  systemInfoSchema,
} from "./schemas"

import type {
  ReadinessResponse,
  StatusResponse,
  SystemHealth,
  SystemInfo,
} from "./types"

// Public (no token) — liveness/readiness probes.
export const getLiveness = (): Promise<StatusResponse> =>
  apiFetch("/healthz").then((data) => parseWith(statusSchema, data))

export const getReadiness = (): Promise<ReadinessResponse> =>
  apiFetch("/readyz").then((data) => parseWith(readinessSchema, data))

// Admin (token required) — Phase 5 dashboard data sources. The token is
// passed through explicitly at verification time so the login flow can prove a
// token WITHOUT first committing it to the session store (§4).
export const getSystemHealth = (token?: string): Promise<SystemHealth> =>
  apiFetch("/api/v1/system/health", undefined, token).then((data) =>
    parseWith(systemHealthSchema, data)
  )

export const getSystemInfo = (): Promise<SystemInfo> =>
  apiFetch("/api/v1/system/info").then((data) =>
    parseWith(systemInfoSchema, data)
  )

// ── TanStack Query wiring (§9) ──────────────────────────────────────────────
// Shared keys/options so the Dashboard route and the Topbar status pill hit
// ONE cached query. Owner policy (Phase 5): NO background polling — data is
// fetched once on first mount and only refetched by explicit user action
// (dashboard Refresh button / status-pill click). staleTime=Infinity keeps
// route changes and re-mounts from hitting the backend (rate limit: 100
// req/10s per IP); refetchOnWindowFocus is globally off (queryClient.ts).
export const SYSTEM_HEALTH_QUERY_KEY = ["system", "health"] as const
export const SYSTEM_INFO_QUERY_KEY = ["system", "info"] as const

export const SYSTEM_HEALTH_QUERY = {
  queryKey: SYSTEM_HEALTH_QUERY_KEY,
  queryFn: () => getSystemHealth(),
  staleTime: Number.POSITIVE_INFINITY,
  refetchInterval: false,
} as const

export const SYSTEM_INFO_QUERY = {
  queryKey: SYSTEM_INFO_QUERY_KEY,
  queryFn: getSystemInfo,
  staleTime: Number.POSITIVE_INFINITY,
  refetchInterval: false,
} as const
