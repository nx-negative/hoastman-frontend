import { useQuery } from "@tanstack/react-query"

import { SYSTEM_HEALTH_QUERY } from "@/api/health"
import { cn } from "@/lib/utils"

type Tone = "success" | "warning" | "error" | "muted"

const TONES: Record<Tone, string> = {
  success: "bg-secondary text-secondary-foreground",
  warning: "bg-muted text-muted-foreground",
  error: "bg-destructive/15 text-destructive",
  muted: "bg-foreground/5 text-muted-foreground",
}

const DOTS: Record<Tone, string> = {
  success: "bg-foreground",
  warning: "bg-muted-foreground",
  error: "bg-destructive",
  muted: "bg-muted-foreground/60",
}

interface PillProps {
  tone: Tone
  label: string
  onRefresh: () => void
  busy: boolean
}

/** §7 semantic pill: tinted translucent bg + colored dot/text, no outlines. */
function Pill({ tone, label, onRefresh, busy }: PillProps) {
  return (
    <button
      type="button"
      onClick={onRefresh}
      disabled={busy}
      title="Check backend status now"
      aria-label={`Backend status: ${label}. Activate to refresh.`}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium transition-[filter] hover:brightness-110 disabled:cursor-progress disabled:hover:brightness-100",
        TONES[tone]
      )}
    >
      <span className={cn("size-1.5 animate-pulse rounded-full", DOTS[tone])} />
      {label}
    </button>
  )
}

/**
 * Topbar status pill (§7/§12 Phase 5). Shares the dashboard's cached "system
 * health" query — zero extra requests. Manual-fetch policy (owner): no
 * polling; clicking the pill is an explicit one-shot refresh.
 */
export function StatusPill() {
  const { data, isPending, isError, refetch, isFetching } = useQuery({
    ...SYSTEM_HEALTH_QUERY,
  })
  const onRefresh = () => {
    void refetch()
  }

  if (isPending) {
    return (
      <Pill
        tone="muted"
        label="Connecting…"
        onRefresh={onRefresh}
        busy={isFetching}
      />
    )
  }
  if (isError) {
    return (
      <Pill
        tone="error"
        label="Offline"
        onRefresh={onRefresh}
        busy={isFetching}
      />
    )
  }
  return (
    <Pill
      tone={data.status === "ok" ? "success" : "warning"}
      label={data.status === "ok" ? "Operational" : data.status}
      onRefresh={onRefresh}
      busy={isFetching}
    />
  )
}
