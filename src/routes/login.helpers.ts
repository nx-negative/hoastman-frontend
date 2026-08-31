import { z } from "zod"

import { ApiError } from "@/api/client"

export const loginSchema = z.object({
  token: z.string().trim().min(1, "Admin token is required"),
})

export interface SubmitError {
  title: string
  detail: string
}

/** Maps API failures to owner-facing copy — no backend internals leak (§2.12). */
export function getLoginErrorMessage(error: unknown): SubmitError {
  if (error instanceof ApiError) {
    if (error.code === "admin_disabled") {
      return {
        title: "Admin access is disabled on the server.",
        detail: "Contact the server operator.",
      }
    }
    if (error.status === 401 || error.code === "invalid_admin_token") {
      return {
        title: "Invalid admin token.",
        detail: "Check the token and try again.",
      }
    }
    if (error.status === 429 || error.code === "rate_limited") {
      return {
        title: "Too many attempts.",
        detail: "Wait a few seconds and try again.",
      }
    }
    if (error.status === 0 || [502, 504].includes(error.status)) {
      // 0 = fetch threw (network); 502/504 = the dev proxy can't reach a
      // stopped backend. Either way the owner should treat it as offline.
      return {
        title: "Cannot reach the server.",
        detail: "Confirm the API server is running.",
      }
    }
  }
  return { title: "Sign-in failed.", detail: "Try again." }
}
