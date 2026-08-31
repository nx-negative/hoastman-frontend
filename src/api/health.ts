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

// Admin (token required) — Phase 5 dashboard data sources.
export const getSystemHealth = (): Promise<SystemHealth> =>
  apiFetch("/api/v1/system/health").then((data) =>
    parseWith(systemHealthSchema, data)
  )

export const getSystemInfo = (): Promise<SystemInfo> =>
  apiFetch("/api/v1/system/info").then((data) =>
    parseWith(systemInfoSchema, data)
  )
