import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { PageHeader } from "@/components/page-header"
import type { LucideIcon } from "lucide-react"

interface FeaturePlaceholderProps {
  title: string
  description: string
  icon: LucideIcon
}

/**
 * Future-state preview rows (backend §24): the connection/permission/error
 * UI this page will grow. Shown as muted rows so the design surface stays
 * visible without implying the feature works today.
 */
const RESERVED_STATES = [
  { label: "Permission", note: "browser permission prompt before access" },
  { label: "Connection", note: "pairing / connecting indicator" },
  { label: "Error", note: "inline reason with a retry action" },
] as const

/**
 * §12 Phase 8: clearly-disabled placeholder page for a future media/control
 * feature. Presentational — props only, no fetching (§6). Neutral default
 * tokens only (owner override 2026-08-31).
 */
export function FeaturePlaceholder({
  title,
  description,
  icon: Icon,
}: FeaturePlaceholderProps) {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={title} description={description} />
      <Card className="gap-0 border-0 p-8">
        <div className="flex flex-col items-center text-center">
          <div className="flex size-12 items-center justify-center rounded-md bg-muted text-muted-foreground">
            <Icon className="size-6" />
          </div>
          <Badge variant="secondary" className="mt-4">
            Coming soon
          </Badge>
          <p className="mt-3 max-w-md text-sm text-muted-foreground">
            {title} is not connected to the backend yet. This page is a
            placeholder — its controls stay disabled until the feature ships.
          </p>
          <dl className="mt-6 grid w-full max-w-md gap-2 text-left">
            {RESERVED_STATES.map((state) => (
              <div
                key={state.label}
                className="flex items-center justify-between gap-4 rounded-md bg-foreground/[0.03] px-3 py-2"
              >
                <dt className="text-xs font-medium">{state.label}</dt>
                <dd className="text-xs text-muted-foreground">{state.note}</dd>
              </div>
            ))}
          </dl>
        </div>
      </Card>
    </div>
  )
}
