import { useState } from "react"
import { useForm } from "@tanstack/react-form"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Ban, FlaskConical, Loader2 } from "lucide-react"
import { Gauge } from "@/components/gauge"
import { PageHeader } from "@/components/page-header"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import {
  cancelLoadTest,
  getLoadReport,
  LOAD_REPORT_QUERY_KEY,
  startLoadTest,
} from "@/api/loadTest"
import type { LoadReport } from "@/api/types"
import {
  DURATION_MAX,
  DURATION_MIN,
  FPS_MAX,
  FPS_MIN,
  firstError,
  getLoadActionErrorMessage,
  loadTestFormSchema,
  MODE_LABELS,
  PAYLOAD_MAX,
  PAYLOAD_MIN,
  SESSIONS_MAX,
  SESSIONS_MIN,
  verdictBadgeClasses,
  verdictDotClasses,
} from "./load-test.helpers"

const MODES = ["screen_view", "full_control", "camera", "mic", "mixed"] as const

// Owner request: plain number fields — no browser steppers (arrows).
const NO_SPINNERS =
  "appearance-none [-moz-appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"

/**
 * Load test runner (§12 Phase 7). Manual-fetch policy (owner) holds at idle:
 * the ONLY polling is the §9 report poll (~1s) while a run is active, stopped
 * by a delivered report, a non-404 error, or a safety cap. Fetching stays in
 * the route (§6); helpers are unit-tested.
 */
export default function LoadTestPage() {
  const [phase, setPhase] = useState<"idle" | "running">("idle")
  const [actionError, setActionError] = useState<string | null>(null)
  const [runClock, setRunClock] = useState({ startedAt: 0, targetSecs: 5 })
  const queryClient = useQueryClient()

  // §9: poll the report every ~1s while a run is active. The backend answers
  // 404 until the run finishes — that 404 KEEPS the poll going; any delivered
  // report or non-404 error stops it. Hard cap = target + 30s.
  const reportQuery = useQuery({
    queryKey: LOAD_REPORT_QUERY_KEY,
    queryFn: getLoadReport,
    enabled: phase === "running",
    staleTime: Number.POSITIVE_INFINITY,
    retry: false,
    refetchInterval: (query) => {
      if (query.state.data) return false
      const status = (query.state.error as { status?: number } | null)?.status
      if (status != null && status !== 404) return false
      const { startedAt, targetSecs } = runClock
      if (startedAt > 0 && Date.now() - startedAt > (targetSecs + 30) * 1000) {
        return false
      }
      return 1_000
    },
  })
  const report = reportQuery.data ?? null
  const isRunning = phase === "running" && report == null

  const startMutation = useMutation({
    mutationFn: startLoadTest,
    onMutate: () => {
      setActionError(null)
      // A new run invalidates the previous report immediately.
      queryClient.removeQueries({ queryKey: LOAD_REPORT_QUERY_KEY })
    },
    onSuccess: () => setPhase("running"),
    onError: (error) => setActionError(getLoadActionErrorMessage(error)),
  })

  const cancelMutation = useMutation({
    mutationFn: cancelLoadTest,
    onError: (error) => setActionError(getLoadActionErrorMessage(error)),
  })

  const form = useForm({
    defaultValues: {
      duration_seconds: "5",
      concurrent_sessions: "4",
      fps: "120",
      payload_size_kb: "64",
      mode: "full_control",
    },
    validators: { onChange: loadTestFormSchema },
    onSubmit: ({ value }) => {
      // Field-level validation normally blocks submit before this point; the
      // catch is a safety net so a failed parse can never be a silent no-op —
      // the message always renders (owner-reported bug, Phase 7).
      let parsed: ReturnType<typeof loadTestFormSchema.parse>
      try {
        parsed = loadTestFormSchema.parse(value)
      } catch {
        setActionError(
          "These settings are out of range — fix the highlighted fields."
        )
        return
      }
      setRunClock({
        startedAt: Date.now(),
        targetSecs: parsed.duration_seconds,
      })
      startMutation.mutate(parsed)
    },
  })

  // TanStack Form aggregates form-level errors as nested issue arrays —
  // flatten and narrow before rendering (no `as` casts).
  const formErrors = form.state.errors
    .flat()
    .map((error) =>
      typeof error === "string"
        ? error
        : typeof error?.message === "string"
          ? error.message
          : ""
    )
    .filter(Boolean)

  function handleRunAnother() {
    queryClient.removeQueries({ queryKey: LOAD_REPORT_QUERY_KEY })
    setPhase("idle")
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Load Test"
        description="Run a bounded synthetic workload and review the report."
      />

      <Card className="gap-0 border-0 p-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-sm font-semibold tracking-tight">Run a test</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Bounds: duration 1–300 s · sessions 1–256 · fps 1–240 · payload 1
              KB–1 GB. If the backend can't take a workload it rejects the start
              and the reason appears below.
            </p>
          </div>
        </div>

        <form
          onSubmit={(event) => {
            event.preventDefault()
            event.stopPropagation()
            void form.handleSubmit()
          }}
          className="mt-4 flex flex-col gap-4"
        >
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <form.Field name="duration_seconds">
              {(field) => (
                <FieldShell
                  label="Duration (s)"
                  message={firstError(field.state.meta.errors)}
                >
                  <Input
                    id={field.name}
                    type="number"
                    min={DURATION_MIN}
                    max={DURATION_MAX}
                    className={NO_SPINNERS}
                    disabled={isRunning}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                  />
                </FieldShell>
              )}
            </form.Field>
            <form.Field name="concurrent_sessions">
              {(field) => (
                <FieldShell
                  label="Sessions"
                  message={firstError(field.state.meta.errors)}
                >
                  <Input
                    id={field.name}
                    type="number"
                    min={SESSIONS_MIN}
                    max={SESSIONS_MAX}
                    className={NO_SPINNERS}
                    disabled={isRunning}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                  />
                </FieldShell>
              )}
            </form.Field>
            <form.Field name="fps">
              {(field) => (
                <FieldShell
                  label="FPS"
                  message={firstError(field.state.meta.errors)}
                >
                  <Input
                    id={field.name}
                    type="number"
                    min={FPS_MIN}
                    max={FPS_MAX}
                    className={NO_SPINNERS}
                    disabled={isRunning}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                  />
                </FieldShell>
              )}
            </form.Field>
            <form.Field name="payload_size_kb">
              {(field) => (
                <FieldShell
                  label="Payload (KB)"
                  message={firstError(field.state.meta.errors)}
                >
                  <Input
                    id={field.name}
                    type="number"
                    min={PAYLOAD_MIN}
                    max={PAYLOAD_MAX}
                    className={NO_SPINNERS}
                    disabled={isRunning}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                  />
                </FieldShell>
              )}
            </form.Field>
          </div>

          <div className="flex flex-wrap items-end gap-4">
            <form.Field name="mode">
              {(field) => (
                <div className="flex w-56 flex-col gap-1.5">
                  <Label htmlFor={field.name}>Mode</Label>
                  <Select
                    value={field.state.value}
                    onValueChange={(value) => {
                      // Base UI emits null when a value is cleared — ours is
                      // non-clearable, so ignore null and keep the previous.
                      if (value) field.handleChange(value)
                    }}
                    disabled={isRunning}
                  >
                    <SelectTrigger id={field.name} className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {MODES.map((mode) => (
                        <SelectItem key={mode} value={mode}>
                          {MODE_LABELS[mode]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </form.Field>
            <form.Subscribe selector={(state) => state.isSubmitting}>
              {(isSubmitting) => (
                <Button
                  type="submit"
                  disabled={isRunning || isSubmitting}
                  className="min-w-36"
                >
                  <FlaskConical className="size-4" />
                  {isRunning ? "Test running…" : "Start Test"}
                </Button>
              )}
            </form.Subscribe>
          </div>

          {formErrors.map((message) => (
            <p key={message} className="text-xs text-destructive">
              {message}
            </p>
          ))}
        </form>

        {actionError ? (
          <Alert variant="destructive" className="mt-4">
            <AlertTitle>Request failed</AlertTitle>
            <AlertDescription>{actionError}</AlertDescription>
          </Alert>
        ) : null}

        {isRunning ? (
          <div className="mt-4 flex flex-wrap items-center gap-3 rounded-lg bg-foreground/[0.04] p-4">
            <Loader2 className="size-4 animate-spin text-muted-foreground" />
            <p className="text-sm">
              Test running — sampling the report every second. The backend
              writes the report when the run finishes.
            </p>
            <Button
              variant="outline"
              size="sm"
              className="ml-auto"
              disabled={cancelMutation.isPending}
              onClick={() => cancelMutation.mutate()}
            >
              <Ban className="size-4" />
              Cancel test
            </Button>
          </div>
        ) : null}
      </Card>

      {report ? (
        <ReportCard report={report} onRunAnother={handleRunAnother} />
      ) : null}
    </div>
  )
}

function ReportCard({
  report,
  onRunAnother,
}: {
  report: LoadReport
  onRunAnother: () => void
}) {
  return (
    <Card className="gap-0 border-0 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold tracking-tight">Report</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            {report.completed ? "Completed" : "Cancelled"} · mode{" "}
            {MODE_LABELS[report.mode]}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span
            className={
              verdictBadgeClasses(report.verdict) +
              " inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium"
            }
          >
            <span
              className={
                "size-1.5 rounded-full " + verdictDotClasses(report.verdict)
              }
            />
            {report.verdict}
          </span>
          <Button variant="outline" size="sm" onClick={onRunAnother}>
            Run another test
          </Button>
        </div>
      </div>

      <Separator className="my-5" />

      <div className="grid gap-8 lg:grid-cols-[auto_1fr]">
        <div className="flex items-center justify-center">
          <Gauge
            percent={report.cpu_usage_percent}
            label="Peak CPU"
            sublabel={`${report.memory_used_mb.toFixed(1)} MB peak memory`}
          />
        </div>
        <div className="flex flex-col gap-5">
          <div>
            <p className="text-3xl font-bold tracking-tight tabular-nums">
              {report.requests_per_second.toFixed(1)}
              <span className="ml-1 text-sm font-medium text-muted-foreground">
                req/s
              </span>
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {report.total_requests.toLocaleString()} requests ·{" "}
              {report.frames_processed.toLocaleString()} frames ·{" "}
              {report.events_processed.toLocaleString()} events
            </p>
          </div>
          <dl className="grid gap-x-8 gap-y-2.5 sm:grid-cols-2">
            <Row
              label="Duration (target → actual)"
              value={`${report.target_duration_secs}s → ${report.actual_duration_secs.toFixed(2)}s`}
            />
            <Row
              label="FPS (target → actual)"
              value={`${report.target_fps} → ${report.actual_fps.toFixed(2)}`}
            />
            <Row
              label="Latency p50 / p95 / p99"
              value={`${report.p50_latency_ms.toFixed(2)} / ${report.p95_latency_ms.toFixed(2)} / ${report.p99_latency_ms.toFixed(2)} ms`}
            />
            <Row
              label="Failed requests"
              value={String(report.failed_requests)}
            />
            <Row label="Dropped events" value={String(report.dropped_events)} />
            <Row
              label="Sessions (payload KB)"
              value={`${report.concurrent_sessions} (${report.payload_size_kb})`}
            />
            <Row
              label="Max concurrent sessions"
              value={String(report.max_concurrent_sessions)}
            />
            <Row
              label="Estimated stable capacity"
              value={`${report.estimated_stable_capacity} sessions`}
            />
          </dl>
        </div>
      </div>

      {report.recommendations.length > 0 ? (
        <div className="mt-5 rounded-lg bg-foreground/[0.04] p-4">
          <p className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
            Recommendations
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
            {report.recommendations.map((rec) => (
              <li key={rec}>{rec}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </Card>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="text-sm font-medium tabular-nums">{value}</dd>
    </div>
  )
}

function FieldShell({
  label,
  message,
  children,
}: {
  label: string
  message?: string
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={label.toLowerCase().replace(/[^a-z]+/g, "-")}>
        {label}
      </Label>
      {children}
      {message ? <p className="text-xs text-destructive">{message}</p> : null}
    </div>
  )
}
