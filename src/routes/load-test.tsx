import { PageHeader } from "@/components/page-header"

/** Empty page shell — load test form + report UI lands in Phase 7 (§12). */
export default function LoadTestPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Load Test"
        description="Run bounded load tests and review live reports."
      />
      <div className="rounded-lg bg-foreground/[0.03] p-8 text-center">
        <p className="text-sm text-muted-foreground">
          No load test runner yet — backend hookup arrives in Phase 7.
        </p>
      </div>
    </div>
  )
}
