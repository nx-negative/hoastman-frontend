// Types are DERIVED from the Zod schemas (which mirror docs/backend-api/
// openapi.json) so compile-time types and runtime validation cannot drift.
import type { z } from "zod"

import {
  loadInputSchema,
  loadModeSchema,
  loadReportSchema,
  loadTestAckSchema,
  loadVerdictSchema,
  readinessSchema,
  serviceSchema,
  serviceStateSchema,
  servicesSchema,
  statusSchema,
  systemHealthSchema,
  systemInfoSchema,
  systemMetricsSchema,
} from "./schemas"

export type LoadMode = z.infer<typeof loadModeSchema>
export type ServiceState = z.infer<typeof serviceStateSchema>
export type LoadVerdict = z.infer<typeof loadVerdictSchema>
export type Service = z.infer<typeof serviceSchema>
export type ServicesResponse = z.infer<typeof servicesSchema>
export type SystemMetrics = z.infer<typeof systemMetricsSchema>
export type SystemHealth = z.infer<typeof systemHealthSchema>
export type SystemInfo = z.infer<typeof systemInfoSchema>
export type LoadInput = z.infer<typeof loadInputSchema>
export type LoadTestAck = z.infer<typeof loadTestAckSchema>
export type LoadReport = z.infer<typeof loadReportSchema>
export type StatusResponse = z.infer<typeof statusSchema>
export type ReadinessResponse = z.infer<typeof readinessSchema>
