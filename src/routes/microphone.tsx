import { Mic } from "lucide-react"

import { FeaturePlaceholder } from "@/components/feature-placeholder"

/** §12 Phase 8 placeholder — disabled until backend media support (§24). */
export default function MicrophonePage() {
  return (
    <FeaturePlaceholder
      title="Microphone"
      description="Live mic capture and stream control — reserved for a future phase."
      icon={Mic}
    />
  )
}
