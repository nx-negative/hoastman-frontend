import { describe, expect, it } from "vitest"

import {
  ACTION_ITEMS,
  getActionErrorMessage,
  stateBadgeClasses,
  stateDotClasses,
  stateDotPulse,
  STATE_LABELS,
} from "./services.helpers"

describe("service action items", () => {
  it("exposes the five backend actions", () => {
    expect(ACTION_ITEMS.map((item) => item.action)).toEqual([
      "start",
      "stop",
      "pending",
      "enable",
      "disable",
    ])
  })

  it("labels every action", () => {
    for (const item of ACTION_ITEMS) {
      expect(item.label.length).toBeGreaterThan(0)
    }
  })
})

describe("state styling maps", () => {
  it("covers all four service states", () => {
    for (const state of ["enabled", "disabled", "pending", "error"] as const) {
      expect(STATE_LABELS[state].length).toBeGreaterThan(0)
      expect(stateBadgeClasses(state)).not.toBe("")
      expect(stateDotClasses(state)).not.toBe("")
    }
  })

  it("marks error state destructive and pending pulsing", () => {
    expect(stateBadgeClasses("error")).toContain("destructive")
    expect(stateDotPulse("pending")).toBe(true)
    expect(stateDotPulse("enabled")).toBe(false)
  })
})

describe("getActionErrorMessage", () => {
  it("maps auth failures", () => {
    expect(getActionErrorMessage({ status: 401 })).toMatch(/sign in/i)
    expect(getActionErrorMessage({ code: "admin_disabled" })).toMatch(
      /sign in/i
    )
  })

  it("maps not-found and rate limiting", () => {
    expect(getActionErrorMessage({ status: 404 })).toMatch(/not found/i)
    expect(getActionErrorMessage({ status: 429 })).toMatch(/too many/i)
  })

  it("maps rejections and generic server failures", () => {
    expect(getActionErrorMessage({ status: 409 })).toMatch(/rejected/i)
    expect(getActionErrorMessage({ status: 500 })).toMatch(/try again/i)
  })

  it("treats status-less errors as unreachable server", () => {
    expect(getActionErrorMessage(new Error("boom"))).toMatch(
      /reach the server/i
    )
    expect(getActionErrorMessage(undefined)).toMatch(/reach the server/i)
  })
})
