import type { ServiceAction } from "@/api/services"
import type { Service } from "@/api/types"

export type ServiceState = Service["state"]

export const STATE_LABELS: Record<ServiceState, string> = {
  enabled: "Enabled",
  disabled: "Disabled",
  pending: "Pending",
  error: "Error",
}

// Default neutral tokens only (owner override 2026-08-31) — no custom palette.
const STATE_BADGES: Record<ServiceState, string> = {
  enabled: "bg-secondary text-secondary-foreground",
  disabled: "bg-muted text-muted-foreground",
  pending: "bg-secondary text-secondary-foreground",
  error: "bg-destructive/15 text-destructive",
}

const STATE_DOTS: Record<ServiceState, string> = {
  enabled: "bg-foreground",
  disabled: "bg-muted-foreground",
  pending: "bg-foreground/70",
  error: "bg-destructive",
}

export function stateBadgeClasses(state: ServiceState): string {
  return STATE_BADGES[state]
}

export function stateDotClasses(state: ServiceState): string {
  return STATE_DOTS[state]
}

/** Pending states get a pulsing dot (§7 semantic, now neutral). */
export function stateDotPulse(state: ServiceState): boolean {
  return state === "pending"
}

export interface ActionItem {
  action: ServiceAction
  label: string
  destructive: boolean
}

/** All five backend actions (§12 Phase 6) — backend accepts any per state. */
export const ACTION_ITEMS: ActionItem[] = [
  { action: "start", label: "Start", destructive: false },
  { action: "stop", label: "Stop", destructive: true },
  { action: "pending", label: "Mark Pending", destructive: false },
  { action: "enable", label: "Enable", destructive: false },
  { action: "disable", label: "Disable", destructive: true },
]

/**
 * Normalized action-failure copy (§9): fixed strings keyed by status/code —
 * backend internals are never echoed (§2.12). No status at all means the
 * request never left (network/DNS/proxy down).
 */
export function getActionErrorMessage(error: unknown): string {
  const candidate = error as { status?: number; code?: string } | null
  const status = candidate?.status
  const code = candidate?.code
  if (status === 401 || code === "unauthorized" || code === "admin_disabled") {
    return "Not authorized — sign in again."
  }
  if (status === 404 || code === "not_found" || code === "service_not_found") {
    return "Service not found — refresh the list."
  }
  if (status === 409 || status === 422) {
    return "The backend rejected this action for the service's current state."
  }
  if (status === 429) {
    return "Too many requests — wait a moment and try again."
  }
  if (typeof status === "number") {
    return "Action failed — try again."
  }
  return "Cannot reach the server. Check that the API is running."
}
