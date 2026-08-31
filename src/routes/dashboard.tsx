import { useQuery } from "@tanstack/react-query"
import { Activity, Cpu, HardDrive, MemoryStick, RefreshCw } from "lucide-react"
import type { ReactNode } from "react"

import { PageHeader } from "@/components/page-header"
import { StatCard } from "@/components/stat-card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { SYSTEM_HEALTH_QUERY, SYSTEM_INFO_QUERY } from "@/api/health"
import {
  formatBytes,
  formatPercent,
  formatServerTime,
  formatUptime,
  percentOf,
  shortCommit,
} from "@/lib/format"
import { cn } from "@/lib/utils"

/**
 * Dashboard core (§12 Phase 5) — manual-fetch policy (owner request): data is
 * loaded once on first mount and ONLY refetched via the Refresh button (or
 * the topbar pill). No background polling. Data fetching stays in the route
 * component (§6); formatting helpers are unit-tested in lib/format.
 */
export default function DashboardPage() {
  const healthQuery = useQuery({ ...SYSTEM_HEALTH_QUERY })
  const infoQuery = useQuery({ ...SYSTEM_INFO_QUERY })

  const metrics = healthQuery.data?.metrics ?? null
  const info = infoQuery.data
  const isFetching = healthQuery.isFetching || infoQuery.isFetching

  function handleRefresh() {
    void healthQuery.refetch()
    void infoQuery.refetch()
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <PageHeader
          title="Dashboard"
          description="System health and resources — fetched on demand."
        />
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground tabular-nums">
            {healthQuery.dataUpdatedAt > 0
              ? `Updated ${formatServerTime(healthQuery.dataUpdatedAt)}`
              : "Not loaded yet"}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={isFetching}
            onClick={handleRefresh}
          >
            <RefreshCw className={cn("size-4", isFetching && "animate-spin")} />
            Refresh
          </Button>
        </div>
      </div>

      {healthQuery.isError ? (
        <Alert variant="destructive">
          <AlertTitle>Could not load system data</AlertTitle>
          <AlertDescription>
            The API server did not respond to the last request.
          </AlertDescription>
          <Button
            variant="outline"
            size="sm"
            className="mt-3"
            onClick={handleRefresh}
          >
            <RefreshCw /> Retry
          </Button>
        </Alert>
      ) : (
        <>
          <section
            aria-label="Resource usage"
            className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
          >
            {healthQuery.isPending ? (
              <>
                <StatSkeleton />
                <StatSkeleton />
                <StatSkeleton />
                <StatSkeleton />
              </>
            ) : (
              <>
                <StatCard
                  label="CPU"
                  value={
                    metrics ? formatPercent(metrics.cpu_usage_percent) : "—"
                  }
                  hint={
                    metrics
                      ? `${metrics.cpu_count} vCPU`
                      : "Metrics unavailable"
                  }
                  meter={metrics ? metrics.cpu_usage_percent : null}
                  accent="primary"
                  icon={<Cpu className="size-4" />}
                />
                <StatCard
                  label="Memory"
                  value={metrics ? formatBytes(metrics.memory_used_bytes) : "—"}
                  hint={
                    metrics
                      ? `of ${formatBytes(metrics.memory_total_bytes)}`
                      : "Metrics unavailable"
                  }
                  meter={
                    metrics
                      ? percentOf(
                          metrics.memory_used_bytes,
                          metrics.memory_total_bytes
                        )
                      : null
                  }
                  accent="secondary"
                  icon={<MemoryStick className="size-4" />}
                />
                <StatCard
                  label="Disk"
                  value={metrics ? formatBytes(metrics.disk_used_bytes) : "—"}
                  hint={
                    metrics
                      ? `of ${formatBytes(metrics.disk_total_bytes)}`
                      : "Metrics unavailable"
                  }
                  meter={
                    metrics
                      ? percentOf(
                          metrics.disk_used_bytes,
                          metrics.disk_total_bytes
                        )
                      : null
                  }
                  accent="tertiary"
                  icon={<HardDrive className="size-4" />}
                />
                <StatCard
                  label="Process Memory"
                  value={
                    metrics ? formatBytes(metrics.process_memory_bytes) : "—"
                  }
                  hint={
                    metrics ? "HOSTMAN core process" : "Metrics unavailable"
                  }
                  accent="success"
                  icon={<Activity className="size-4" />}
                />
              </>
            )}
          </section>

          <section
            aria-label="System details"
            className="grid gap-4 lg:grid-cols-2"
          >
            <Card className="glow-secondary gap-0 border-0 p-6">
              <CardRows
                title="System"
                rows={[
                  {
                    label: "Operating system",
                    value: joinParts(
                      info?.os ?? metrics?.os_name,
                      info?.os_version ?? metrics?.os_version
                    ),
                  },
                  { label: "Kernel", value: orDash(metrics?.kernel_version) },
                  {
                    label: "Architecture",
                    value: joinParts(info?.arch, info?.family),
                  },
                  {
                    label: "CPU model",
                    value: orDash(metrics?.cpu_model ?? info?.cpu_model),
                  },
                  {
                    label: "System uptime",
                    value:
                      metrics?.system_uptime_seconds != null
                        ? formatUptime(metrics.system_uptime_seconds)
                        : info?.system_uptime_seconds != null
                          ? formatUptime(info.system_uptime_seconds)
                          : "—",
                  },
                ]}
              />
            </Card>
            <Card className="glow-primary gap-0 border-0 p-6">
              <CardRows
                title="Runtime"
                rows={[
                  {
                    label: "Core version",
                    value: mono(
                      orDash(
                        healthQuery.data?.core_version ?? info?.core_version
                      )
                    ),
                  },
                  {
                    label: "Service API version",
                    value: mono(orDash(info?.service_api_version)),
                  },
                  {
                    label: "Server time",
                    value: healthQuery.data
                      ? mono(
                          formatServerTime(healthQuery.data.server_time_unix_ms)
                        )
                      : "—",
                  },
                  {
                    label: "Core uptime",
                    value: healthQuery.data
                      ? formatUptime(healthQuery.data.uptime_seconds)
                      : "—",
                  },
                  {
                    label: "Git commit",
                    value: mono(shortCommit(info?.git_commit)),
                  },
                ]}
              />
            </Card>
          </section>
        </>
      )}
    </div>
  )
}

function StatSkeleton() {
  return (
    <Card className="gap-0 border-0 p-5">
      <Skeleton className="h-3 w-20" />
      <Skeleton className="mt-4 h-9 w-24" />
      <Skeleton className="mt-4 h-1.5 w-full" />
    </Card>
  )
}

interface Row {
  label: string
  value: ReactNode
}

function CardRows({ title, rows }: { title: string; rows: Row[] }) {
  return (
    <div>
      <h2 className="text-sm font-semibold tracking-tight">{title}</h2>
      <dl className="mt-3 divide-y divide-foreground/5">
        {rows.map((row) => (
          <div
            key={row.label}
            className="flex items-center justify-between gap-4 py-2.5"
          >
            <dt className="text-xs text-muted-foreground">{row.label}</dt>
            <dd className="text-sm font-medium tabular-nums">{row.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  )
}

function mono(node: ReactNode): ReactNode {
  return <span className="font-mono text-xs">{node}</span>
}

function orDash(value: string | null | undefined): string {
  return value ?? "—"
}

function joinParts(...parts: Array<string | null | undefined>): string {
  const joined = parts.filter(Boolean).join(" ").trim()
  return joined || "—"
}
