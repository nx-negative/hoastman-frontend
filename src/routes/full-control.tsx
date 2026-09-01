import { MousePointerClick } from "lucide-react"

import { FeaturePlaceholder } from "@/components/feature-placeholder"

/** §12 Phase 8 placeholder — disabled until backend full control (§24). */
export default function FullControlPage() {
  return (
    <FeaturePlaceholder
      title="Full Control"
      description="Remotely control the host — reserved for a future phase."
      icon={MousePointerClick}
    />
  )
}
