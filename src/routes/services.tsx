import { PageHeader } from "@/components/page-header"

/** Empty page shell — service control UI lands in Phase 6 (§12). */
export default function ServicesPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Services"
        description="Start, stop, enable, and disable monitored services."
      />
      <div className="rounded-lg bg-foreground/[0.03] p-8 text-center">
        <p className="text-sm text-muted-foreground">
          No service controls yet — backend hookup arrives in Phase 6.
        </p>
      </div>
    </div>
  )
}
