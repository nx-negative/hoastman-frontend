import { Camera } from "lucide-react"

import { FeaturePlaceholder } from "@/components/feature-placeholder"

/** §12 Phase 8 placeholder — disabled until backend media support (§24). */
export default function CameraPage() {
  return (
    <FeaturePlaceholder
      title="Camera"
      description="Live camera preview and stream control — reserved for a future phase."
      icon={Camera}
    />
  )
}
