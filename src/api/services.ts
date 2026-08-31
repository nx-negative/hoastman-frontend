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
