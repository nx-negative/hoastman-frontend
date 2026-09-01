import { Monitor } from "lucide-react"

import { FeaturePlaceholder } from "@/components/feature-placeholder"

/** §12 Phase 8 placeholder — disabled until backend screen streaming (§24). */
export default function ScreenViewPage() {
  return (
    <FeaturePlaceholder
      title="Screen View"
      description="Watch a remote screen in real time — reserved for a future phase."
      icon={Monitor}
    />
  )
}
