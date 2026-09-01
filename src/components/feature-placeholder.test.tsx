// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it } from "vitest"
import { Camera } from "lucide-react"

import { FeaturePlaceholder } from "./feature-placeholder"

afterEach(cleanup)

describe("FeaturePlaceholder (§12 Phase 8)", () => {
  it("renders title, coming-soon badge, and reserved §24 states", () => {
    render(
      <FeaturePlaceholder
        title="Camera"
        description="Camera placeholder."
        icon={Camera}
      />
    )
    expect(screen.getByRole("heading", { name: "Camera" })).toBeTruthy()
    expect(screen.getByText("Coming soon")).toBeTruthy()
    for (const label of ["Permission", "Connection", "Error"]) {
      expect(screen.getByText(label)).toBeTruthy()
    }
  })

  it("never renders live controls (no buttons)", () => {
    render(
      <FeaturePlaceholder
        title="Full Control"
        description="Control placeholder."
        icon={Camera}
      />
    )
    expect(screen.queryByRole("button")).toBeNull()
  })
})
