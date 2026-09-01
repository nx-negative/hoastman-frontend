import { z } from "zod"

import type { LoadReport } from "@/api/types"

// Bounded inputs (owner override 2026-09-01): payload max is now 1 GB
// (1_048_576 KB). The backend remains the sole authority on the workload it
// can take — the frontend does NOT pre-check the budget anymore; a rejected
// start (400/409/…) always surfaces as a visible error message.
export const DURATION_MIN = 1
export const DURATION_MAX = 300
export const SESSIONS_MIN = 1
export const SESSIONS_MAX = 256
export const FPS_MIN = 1
export const FPS_MAX = 240
export const PAYLOAD_MIN = 1
export const PAYLOAD_MAX = 1_048_576

export const MODE_LABELS = {
  screen_view: "Screen View",
  full_control: "Full Control",
  camera: "Camera",
  mic: "Microphone",
  mixed: "Mixed",
} as const

// Inputs are HTML fields → the FORM holds raw strings; the schema parses them
// into numbers (matches TanStack Form's value types, §5 login pattern).
const boundedIntField = (min: number, max: number, label: string) =>
  z
    .string()
    .trim()
    .min(1, `${label} is required`)
    .transform((raw) => Number(raw))
    .refine(
      (value) => Number.isInteger(value),
      `${label} must be a whole number`
    )
    .refine(
      (value) => value >= min && value <= max,
      `${label} must be between ${min} and ${max}`
    )

export const loadTestFormSchema = z.object({
  duration_seconds: boundedIntField(DURATION_MIN, DURATION_MAX, "Duration"),
  concurrent_sessions: boundedIntField(SESSIONS_MIN, SESSIONS_MAX, "Sessions"),
  fps: boundedIntField(FPS_MIN, FPS_MAX, "FPS"),
  payload_size_kb: boundedIntField(PAYLOAD_MIN, PAYLOAD_MAX, "Payload size"),
  mode: z
    .string()
    .pipe(z.enum(["screen_view", "full_control", "camera", "mic", "mixed"])),
})

export type LoadTestFormValues = z.output<typeof loadTestFormSchema>

/** Neutral tokens only (owner override) — verdict styling, no custom hues. */
const VERDICT_BADGES: Record<LoadReport["verdict"], string> = {
  stable: "bg-secondary text-secondary-foreground",
  degraded: "bg-secondary text-secondary-foreground",
  overloaded: "bg-destructive/15 text-destructive",
}

const VERDICT_DOTS: Record<LoadReport["verdict"], string> = {
  stable: "bg-foreground",
  degraded: "bg-foreground/70",
  overloaded: "bg-destructive",
}

export function verdictBadgeClasses(verdict: LoadReport["verdict"]): string {
  return VERDICT_BADGES[verdict]
}

export function verdictDotClasses(verdict: LoadReport["verdict"]): string {
  return VERDICT_DOTS[verdict]
}

/**
 * Normalized start/cancel failure copy (§9): fixed strings keyed by status/
 * code — backend internals never echoed (§2.12). No status = never left.
 */
export function getLoadActionErrorMessage(error: unknown): string {
  const candidate = error as { status?: number; code?: string } | null
  const status = candidate?.status
  const code = candidate?.code
  if (status === 401 || code === "unauthorized" || code === "admin_disabled") {
    return "Not authorized — sign in again."
  }
  if (status === 400 || code === "invalid_request") {
    return "The backend rejected these settings — check bounds and workload budget."
  }
  if (status === 409 || code === "conflict") {
    return "A load test is already running — cancel it before starting another."
  }
  if (status === 429) {
    return "Too many requests — wait a moment and try again."
  }
  if (typeof status === "number") {
    return "Request failed — try again."
  }
  return "Cannot reach the server. Check that the API is running."
}

interface FormIssue {
  message?: unknown
}

/**
 * First human-readable error from TanStack Form field meta (issues may be
 * strings, nested arrays, or `{message}` objects). Narrows explicitly —
 * never casts (§2.6). Lives in helpers (not the route) because react-refresh
 * requires route files to export components only.
 */
export function firstError(errors: unknown[]): string | undefined {
  for (const error of errors.flat()) {
    if (typeof error === "string" && error.length > 0) return error
    if (typeof error === "object" && error !== null) {
      const { message } = error as FormIssue
      if (typeof message === "string" && message.length > 0) return message
    }
  }
  return undefined
}
