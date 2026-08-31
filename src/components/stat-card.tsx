import type { ReactNode } from "react"

import { Card } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"

type Accent = "primary" | "secondary" | "tertiary" | "success"

const ACCENT_TEXT: Record<Accent, string> = {
  primary: "text-accent-glow-primary",
  secondary: "text-accent-glow-secondary",
  tertiary: "text-accent-glow-tertiary",
  success: "text-success",
}

const ACCENT_GLOW: Record<Accent, string> = {
  primary: "glow-primary",
  secondary: "glow-secondary",
  tertiary: "glow-tertiary",
  success: "glow-success",
}

/** Indicator color is CLI-managed (bg-primary) — retarget via arbitrary variant. */
const ACCENT_METER: Record<Accent, string> = {
  primary: "[&_[data-slot=progress-indicator]]:bg-accent-glow-primary",
  secondary: "[&_[data-slot=progress-indicator]]:bg-accent-glow-secondary",
  tertiary: "[&_[data-slot=progress-indicator]]:bg-accent-glow-tertiary",
  success: "[&_[data-slot=progress-indicator]]:bg-success",
}

interface StatCardProps {
  label: string
  /** Pre-formatted display value (large, bold per §7). */
  value: string
  hint?: string
  accent: Accent
  /** 0–100 fill; null/undefined hides the meter row. */
  meter?: number | null
  icon?: ReactNode
}

/**
 * §7 stat card: elevated surface (no hard border), soft accent glow, large
 * bold number, muted label. Presentational — props only (§6).
 */
export function StatCard({
  label,
  value,
  hint,
  accent,
  meter,
  icon,
}: StatCardProps) {
  return (
    <Card className={cn("gap-0 border-0 p-5", ACCENT_GLOW[accent])}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium tracking-wider text-muted-foreground uppercase">
          {label}
        </span>
        {icon ? <span className={ACCENT_TEXT[accent]}>{icon}</span> : null}
      </div>
      <p className="mt-3 text-3xl font-bold tracking-tight tabular-nums">
        {value}
      </p>
      {hint ? (
        <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
      ) : null}
      {meter != null ? (
        <Progress
          value={meter}
          className={cn(
            "mt-4 [&_[data-slot=progress-track]]:h-1.5",
            ACCENT_METER[accent]
          )}
        />
      ) : null}
    </Card>
  )
}
