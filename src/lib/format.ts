/**
 * Pure display formatters for dashboard values (Phase 5).
 * No React, no I/O — trivially unit-testable; presentational components
 * consume these via props (§6).
 */

const BYTE_UNITS = ["B", "KiB", "MiB", "GiB", "TiB", "PiB"] as const

/** Binary byte size: 1536 → "1.5 KiB"; non-finite/negative → "—". */
export function formatBytes(bytes: number, digits = 1): string {
  if (!Number.isFinite(bytes) || bytes < 0) return "—"
  let value = bytes
  let unit = 0
  while (value >= 1024 && unit < BYTE_UNITS.length - 1) {
    value /= 1024
    unit += 1
  }
  return unit === 0
    ? `${Math.round(value)} B`
    : `${value.toFixed(digits)} ${BYTE_UNITS[unit]}`
}

/** Percent with one decimal, clamped to 0–100 for display: 12.34 → "12.3%". */
export function formatPercent(value: number): string {
  if (!Number.isFinite(value)) return "—"
  return `${clampPercent(value).toFixed(1)}%`
}

export function clampPercent(value: number): number {
  return Math.min(100, Math.max(0, value))
}

/** used/total as 0–100, or null when the total is not usable (meter hidden). */
export function percentOf(used: number, total: number): number | null {
  if (!Number.isFinite(used) || !Number.isFinite(total) || total <= 0) {
    return null
  }
  return clampPercent((used / total) * 100)
}

/** 90061 → "1d 1h 1m" (top 3 nonzero units); 59 → "59s"; 0 → "0s". */
export function formatUptime(totalSeconds: number): string {
  if (!Number.isFinite(totalSeconds) || totalSeconds < 0) return "—"
  const s = Math.floor(totalSeconds)
  const days = Math.floor(s / 86400)
  const hours = Math.floor((s % 86400) / 3600)
  const minutes = Math.floor((s % 3600) / 60)
  const seconds = s % 60
  const parts: string[] = []
  if (days > 0) parts.push(`${days}d`)
  if (hours > 0) parts.push(`${hours}h`)
  if (minutes > 0) parts.push(`${minutes}m`)
  if (seconds > 0) parts.push(`${seconds}s`)
  return parts.length === 0 ? "0s" : parts.slice(0, 3).join(" ")
}

/** Instant → 24h "HH:MM:SS" in the viewer's timezone (override for tests). */
export function formatServerTime(unixMs: number, timeZone?: string): string {
  const date = new Date(unixMs)
  if (Number.isNaN(date.getTime())) return "—"
  return date.toLocaleTimeString("en-GB", { hour12: false, timeZone })
}

/** Git SHA → 7-char short form; nullish/blank → "—". */
export function shortCommit(commit: string | null | undefined): string {
  const trimmed = commit?.trim()
  return trimmed ? trimmed.slice(0, 7) : "—"
}
