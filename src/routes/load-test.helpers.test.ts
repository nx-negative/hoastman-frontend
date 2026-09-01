import { describe, expect, it } from "vitest"

import {
  firstError,
  getLoadActionErrorMessage,
  loadTestFormSchema,
  verdictBadgeClasses,
  verdictDotClasses,
} from "./load-test.helpers"

const BASE = {
  duration_seconds: "5",
  concurrent_sessions: "4",
  fps: "120",
  payload_size_kb: "64",
  mode: "full_control",
}

describe("loadTestFormSchema", () => {
  it("accepts the backend's example workload", () => {
    expect(() => loadTestFormSchema.parse(BASE)).not.toThrow()
  })

  it("parses numeric strings into numbers", () => {
    const parsed = loadTestFormSchema.parse(BASE)
    expect(parsed.duration_seconds).toBe(5)
    expect(typeof parsed.fps).toBe("number")
  })

  it.each([
    ["duration_seconds", "0"],
    ["duration_seconds", "301"],
    ["concurrent_sessions", "0"],
    ["concurrent_sessions", "257"],
    ["fps", "0"],
    ["fps", "241"],
    ["payload_size_kb", "0"],
    ["payload_size_kb", "1048577"],
  ])("rejects %s = %s (out of bounds)", (field, value) => {
    expect(() =>
      loadTestFormSchema.parse({ ...BASE, [field]: value })
    ).toThrow()
  })

  it("accepts the owner-raised payload cap of 1 GB", () => {
    expect(() =>
      loadTestFormSchema.parse({ ...BASE, payload_size_kb: "1048576" })
    ).not.toThrow()
  })

  it("rejects non-integer and non-numeric input", () => {
    expect(() => loadTestFormSchema.parse({ ...BASE, fps: "12.5" })).toThrow()
    expect(() => loadTestFormSchema.parse({ ...BASE, fps: "abc" })).toThrow()
  })

  it("does NOT pre-check the workload budget — backend decides (owner)", () => {
    // Far beyond the old 262144 pre-check: must parse and submit; the backend
    // accepts or rejects with a visible message.
    expect(() =>
      loadTestFormSchema.parse({
        ...BASE,
        concurrent_sessions: "256",
        fps: "240",
        payload_size_kb: "1048576",
      })
    ).not.toThrow()
  })
})

describe("verdict styling maps", () => {
  it("covers all three verdicts", () => {
    for (const verdict of ["stable", "degraded", "overloaded"] as const) {
      expect(verdictBadgeClasses(verdict)).not.toBe("")
      expect(verdictDotClasses(verdict)).not.toBe("")
    }
  })

  it("marks overloaded destructive", () => {
    expect(verdictBadgeClasses("overloaded")).toContain("destructive")
    expect(verdictBadgeClasses("stable")).not.toContain("destructive")
  })
})

describe("getLoadActionErrorMessage", () => {
  it("maps auth failures", () => {
    expect(getLoadActionErrorMessage({ status: 401 })).toMatch(/sign in/i)
  })

  it("maps invalid settings and conflicts", () => {
    expect(getLoadActionErrorMessage({ status: 400 })).toMatch(/rejected/i)
    expect(getLoadActionErrorMessage({ status: 409 })).toMatch(
      /already running/i
    )
  })

  it("maps rate limiting and generic server failures", () => {
    expect(getLoadActionErrorMessage({ status: 429 })).toMatch(/too many/i)
    expect(getLoadActionErrorMessage({ status: 500 })).toMatch(/try again/i)
  })

  it("treats status-less errors as unreachable server", () => {
    expect(getLoadActionErrorMessage(new Error("boom"))).toMatch(
      /reach the server/i
    )
  })
})

describe("firstError", () => {
  it("returns the first non-empty string issue", () => {
    expect(firstError(["", "Duration must be between 1 and 300"])).toBe(
      "Duration must be between 1 and 300"
    )
  })

  it("flattens nested issue arrays and reads {message} objects", () => {
    expect(
      firstError([
        [{ message: "Sessions must be between 1 and 256" }],
        ["ignored"],
      ])
    ).toBe("Sessions must be between 1 and 256")
  })

  it("returns undefined when nothing usable is present", () => {
    expect(firstError([])).toBeUndefined()
    expect(firstError([{}, [null], ""])).toBeUndefined()
  })
})
