import { PageHeader } from "@/components/page-header"

/** Empty page shell — live health/system data lands in Phase 5 (§12). */
export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Dashboard"
        description="System health and resource overview."
      />
      <div className="rounded-lg bg-foreground/[0.03] p-8 text-center">
        <p className="text-sm text-muted-foreground">
          No widgets yet — live backend hookup arrives in Phase 5.
        </p>
      </div>
    </div>
  )
}
