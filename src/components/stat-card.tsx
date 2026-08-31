import type { ReactNode } from "react"

import { Card } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"

interface StatCardProps {
  label: string
  /** Pre-formatted display value (large, bold). */
  value: string
  hint?: string
  /** 0–100 fill; null/undefined hides the meter row. */
  meter?: number | null
  icon?: ReactNode
}

/**
 * Stat card — stock shadcn neutral styling (owner override 2026-08-31):
 * default card surface/border, muted label, large bold number, default
 * primary progress indicator. No accent colors, no custom shadows. Presentational —
 * props only (§6).
 */
export function StatCard({ label, value, hint, meter, icon }: StatCardProps) {
  return (
    <Card className="gap-0 p-5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium tracking-wider text-muted-foreground uppercase">
          {label}
        </span>
        {icon ? <span className="text-muted-foreground">{icon}</span> : null}
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
          className="mt-4 [&_[data-slot=progress-track]]:h-1.5"
        />
      ) : null}
    </Card>
  )
}
