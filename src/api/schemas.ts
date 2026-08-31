import { z } from "zod"

// Enum-like values are Zod-validated before rendering (§10). Sources:
// openapi.json `LoadMode`, docs/backend-api/README.md (service states, verdicts).
export const LOAD_MODES = [
  "screen_view",
  "full_control",
  "camera",
  "mic",
  "mixed",
] as const
export const SERVICE_STATES = [
  "enabled",
  "disabled",
  "pending",
  "error",
] as const
export const LOAD_VERDICTS = ["stable", "degraded", "overloaded"] as const

export const loadModeSchema = z.enum(LOAD_MODES)
export const serviceStateSchema = z.enum(SERVICE_STATES)
export const loadVerdictSchema = z.enum(LOAD_VERDICTS)

/** int64/int32 fields, all non-negative in this API. */
const nonNegativeInt = z.number().int().min(0)

const nullableString = z.string().nullish()

export const errorBodySchema = z.object({
  code: z.string(),
  message: z.string(),
})

export const statusSchema = z.object({ status: z.string() })

export const readinessSchema = z.object({
  status: z.string(),
  ready: z.boolean(),
})

export const serviceSchema = z.object({
  id: z.string(),
  name: z.string(),
  version: z.string(),
  state: serviceStateSchema,
  bound: z.boolean(),
})

export const servicesSchema = z.object({
  services: z.array(serviceSchema),
})

export const systemMetricsSchema = z.object({
  cpu_count: nonNegativeInt,
  cpu_usage_percent: z.number(),
  cpu_model: nullableString,
  memory_total_bytes: nonNegativeInt,
  memory_used_bytes: nonNegativeInt,
  memory_available_bytes: nonNegativeInt,
  process_memory_bytes: nonNegativeInt,
  disk_total_bytes: nonNegativeInt,
  disk_used_bytes: nonNegativeInt,
  disk_available_bytes: nonNegativeInt,
  system_uptime_seconds: nonNegativeInt,
  collected_at_unix_ms: nonNegativeInt,
  os_name: nullableString,
  os_version: nullableString,
  kernel_version: nullableString,
})

export const systemHealthSchema = z.object({
  status: z.string(),
  core_version: z.string(),
  uptime_seconds: nonNegativeInt,
  server_time_unix_ms: nonNegativeInt,
  services: z.array(serviceSchema),
  metrics: systemMetricsSchema.nullish(),
})

export const systemInfoSchema = z.object({
  name: z.string(),
  core_version: z.string(),
  service_api_version: z.string(),
  os: z.string(),
  arch: z.string(),
  family: z.string(),
  cpu_count: nonNegativeInt,
  git_commit: nullableString,
  // Optional hardware summary — present when a metrics source is wired.
  os_version: nullableString,
  cpu_model: nullableString,
  memory_total_bytes: nonNegativeInt.nullish(),
  disk_total_bytes: nonNegativeInt.nullish(),
  system_uptime_seconds: nonNegativeInt.nullish(),
})

export const loadInputSchema = z.object({
  cancel: z.boolean().nullish(),
  concurrent_sessions: nonNegativeInt.nullish(),
  duration_seconds: nonNegativeInt.nullish(),
  fps: nonNegativeInt.nullish(),
  mode: loadModeSchema.nullish(),
  payload_size_kb: nonNegativeInt.nullish(),
})

export const loadTestAckSchema = z.object({
  accepted: z.boolean(),
  message: z.string(),
})

export const loadReportSchema = z.object({
  mode: loadModeSchema,
  completed: z.boolean(),
  cancelled: z.boolean(),
  target_duration_secs: nonNegativeInt,
  actual_duration_secs: z.number(),
  target_fps: nonNegativeInt,
  actual_fps: z.number(),
  concurrent_sessions: nonNegativeInt,
  payload_size_kb: nonNegativeInt,
  total_requests: nonNegativeInt,
  requests_per_second: z.number(),
  frames_processed: nonNegativeInt,
  events_processed: nonNegativeInt,
  failed_requests: nonNegativeInt,
  dropped_events: nonNegativeInt,
  p50_latency_ms: z.number(),
  p95_latency_ms: z.number(),
  p99_latency_ms: z.number(),
  cpu_usage_percent: z.number(),
  memory_used_mb: z.number(),
  max_concurrent_sessions: nonNegativeInt,
  estimated_stable_capacity: nonNegativeInt,
  verdict: loadVerdictSchema,
  recommendations: z.array(z.string()),
})
