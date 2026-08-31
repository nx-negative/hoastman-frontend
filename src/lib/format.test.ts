import { describe, expect, it } from "vitest"

import {
  formatBytes,
  formatPercent,
  formatServerTime,
  formatUptime,
  percentOf,
  shortCommit,
} from "./format"

describe("formatBytes", () => {
  it("formats binary units", () => {
    expect(formatBytes(0)).toBe("0 B")
    expect(formatBytes(512)).toBe("512 B")
    expect(formatBytes(1536)).toBe("1.5 KiB")
    expect(formatBytes(1073741824)).toBe("1.0 GiB")
  })
  it("hides unusable values", () => {
    expect(formatBytes(-1)).toBe("—")
    expect(formatBytes(Number.NaN)).toBe("—")
  })
})

describe("formatPercent / percentOf", () => {
  it("formats one decimal, clamped", () => {
    expect(formatPercent(12.34)).toBe("12.3%")
    expect(formatPercent(137)).toBe("100.0%")
  })
  it("computes used/total or null", () => {
    expect(percentOf(3, 4)).toBe(75)
    expect(percentOf(5, 0)).toBeNull()
  })
})

describe("formatUptime", () => {
  it("renders top units", () => {
    expect(formatUptime(0)).toBe("0s")
    expect(formatUptime(59)).toBe("59s")
    expect(formatUptime(3661)).toBe("1h 1m 1s")
    expect(formatUptime(90061)).toBe("1d 1h 1m")
  })
})

describe("formatServerTime", () => {
  it("renders 24h clock", () => {
    expect(formatServerTime(0, "UTC")).toBe("00:00:00")
    expect(formatServerTime(23400000, "UTC")).toBe("06:30:00")
  })
})

describe("shortCommit", () => {
  it("shortens and handles blanks", () => {
    expect(shortCommit("abcdef1234567890")).toBe("abcdef1")
    expect(shortCommit(null)).toBe("—")
    expect(shortCommit("   ")).toBe("—")
  })
})
