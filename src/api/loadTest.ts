import { apiFetch, parseWith } from "./client"
import { loadInputSchema, loadReportSchema, loadTestAckSchema } from "./schemas"

import type { LoadInput, LoadReport, LoadTestAck } from "./types"

/** Start a bounded load test (or `{cancel: true}` to stop the running one). */
export async function startLoadTest(input: LoadInput): Promise<LoadTestAck> {
  // Input validated against the schema (bounds arrive in Phase 7's form).
  const body = JSON.stringify(parseWith(loadInputSchema, input))
  return parseWith(
    loadTestAckSchema,
    await apiFetch("/api/v1/system/test/load", { method: "POST", body })
  )
}

export function cancelLoadTest(): Promise<LoadTestAck> {
  return startLoadTest({ cancel: true })
}

/**
 * Latest load-test report. 404 (`not_found`) until a run has completed —
 * Phase 7 polling stops on completed/cancelled/404 (§9).
 */
export const getLoadReport = (): Promise<LoadReport> =>
  apiFetch("/api/v1/system/test/report").then((data) =>
    parseWith(loadReportSchema, data)
  )
