interface GaugeProps {
  /** 0–100. Values outside are clamped for display. */
  percent: number
  label: string
  sublabel?: string
}

/**
 * Radial gauge for the load-test report (§12 Phase 7 "metrics + gauge +
 * verdict"). Presentational — props only (§6). Hand-rolled because shadcn
 * ships no gauge (§8 allows); neutral tokens only (owner override).
 */
export function Gauge({ percent, label, sublabel }: GaugeProps) {
  const clamped = Math.min(100, Math.max(0, percent))
  const radius = 56
  const circumference = 2 * Math.PI * radius
  const offset = circumference * (1 - clamped / 100)

  return (
    <div className="flex flex-col items-center">
      <svg
        viewBox="0 0 140 140"
        className="size-36 -rotate-90"
        role="img"
        aria-label={`${label}: ${clamped.toFixed(1)} percent`}
      >
        <circle
          cx="70"
          cy="70"
          r={radius}
          fill="none"
          className="stroke-muted"
          strokeWidth="10"
        />
        <circle
          cx="70"
          cy="70"
          r={radius}
          fill="none"
          className="stroke-foreground transition-[stroke-dashoffset] duration-700"
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <p className="-mt-24 text-3xl font-bold tracking-tight tabular-nums">
        {clamped.toFixed(1)}
        <span className="ml-0.5 text-base font-medium text-muted-foreground">
          %
        </span>
      </p>
      <div className="mt-14 flex flex-col items-center">
        <p className="text-sm font-semibold">{label}</p>
        {sublabel ? (
          <p className="text-xs text-muted-foreground">{sublabel}</p>
        ) : null}
      </div>
    </div>
  )
}
