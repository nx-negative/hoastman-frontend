import { apiFetch, parseWith } from "./client"
import { serviceSchema, servicesSchema } from "./schemas"

import type { Service } from "./types"

const ACTION_SEGMENTS = {
  start: "start",
  stop: "stop",
  pending: "pending",
  enable: "enable",
  disable: "disable",
} as const

export type ServiceAction = keyof typeof ACTION_SEGMENTS

export async function listServices(): Promise<Service[]> {
  const data = parseWith(servicesSchema, await apiFetch("/api/v1/services"))
  return data.services
}

/** POST /api/v1/services/{id}/{action} → updated service JSON. */
export async function serviceAction(
  id: string,
  action: ServiceAction
): Promise<Service> {
  const path = `/api/v1/services/${encodeURIComponent(id)}/${ACTION_SEGMENTS[action]}`
  return parseWith(serviceSchema, await apiFetch(path, { method: "POST" }))
}

// ── TanStack Query wiring (§9/§12 Phase 6) ──────────────────────────────────
// Manual-fetch policy (owner, Phase 5): no polling — the list is fetched once
// on first mount and refreshed only via the Refresh button or automatically
// after a user-initiated action (refetch-after-action). staleTime=Infinity
// keeps route changes from hitting the backend (rate limit: 100 req/10s/IP).
export const SERVICES_QUERY_KEY = ["services"] as const

export const SERVICES_QUERY = {
  queryKey: SERVICES_QUERY_KEY,
  // Lazy call so test doubles (vi.mock) are honored at fetch time.
  queryFn: () => listServices(),
  staleTime: Number.POSITIVE_INFINITY,
  refetchInterval: false,
} as const
