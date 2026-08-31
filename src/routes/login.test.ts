import { describe, expect, it } from "vitest"
import { ApiError } from "@/api/client"

import { getLoginErrorMessage, loginSchema } from "./login.helpers"

describe("getLoginErrorMessage", () => {
  it("maps 401 to invalid-token copy", () => {
    const result = getLoginErrorMessage(
      new ApiError(401, "unauthorized", "...")
    )
    expect(result.title).toBe("Invalid admin token.")
  })

  it("maps admin_disabled to disabled copy", () => {
    const result = getLoginErrorMessage(
      new ApiError(403, "admin_disabled", "...")
    )
    expect(result.title).toBe("Admin access is disabled on the server.")
  })

  it("maps rate limiting", () => {
    const result = getLoginErrorMessage(
      new ApiError(429, "rate_limited", "...")
    )
    expect(result.title).toBe("Too many attempts.")
  })

  it("maps network failure (status 0)", () => {
    const result = getLoginErrorMessage(new ApiError(0, "network_error", "..."))
    expect(result.title).toBe("Cannot reach the server.")
  })

  it("maps proxy/unreachable-backend errors (502/504) as offline", () => {
    for (const status of [502, 504]) {
      const result = getLoginErrorMessage(new ApiError(status, "x", "..."))
      expect(result.title).toBe("Cannot reach the server.")
    }
  })

  it("falls back to generic copy for unknown errors", () => {
    const result = getLoginErrorMessage(new Error("boom"))
    expect(result.title).toBe("Sign-in failed.")
  })

  it("never echoes backend messages (§2.12)", () => {
    const result = getLoginErrorMessage(
      new ApiError(500, "internal", "dial tcp 10.0.0.4:8080 refused")
    )
    expect(JSON.stringify(result)).not.toContain("10.0.0.4")
  })
})

describe("loginSchema", () => {
  it("rejects empty/whitespace tokens", () => {
    const result = loginSchema.shape.token.safeParse("   ")
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe("Admin token is required")
    }
  })

  it("accepts a real token", () => {
    expect(loginSchema.shape.token.safeParse("secret-token").success).toBe(true)
  })
})
