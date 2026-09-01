import { MapPin } from "lucide-react"

import { FeaturePlaceholder } from "@/components/feature-placeholder"

/** §12 Phase 8 placeholder — disabled until backend location support (§24). */
export default function LocationPage() {
  return (
    <FeaturePlaceholder
      title="Location"
      description="Device location reporting and history — reserved for a future phase."
      icon={MapPin}
    />
  )
}
