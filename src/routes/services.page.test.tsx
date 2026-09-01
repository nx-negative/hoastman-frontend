// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react"
import { MemoryRouter } from "react-router"
import { afterEach, describe, expect, it, vi } from "vitest"

// Hoisted doubles. SERVICES_QUERY.queryFn must be overridden explicitly: the
// real module builds it as a closure over its own listServices, so spreading
// `actual` alone would keep hitting the network inside jsdom.
const mocks = vi.hoisted(() => ({
  listServices: vi.fn(),
  serviceAction: vi.fn(),
}))

vi.mock("@/api/services", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/api/services")>()
  return {
    ...actual,
    listServices: mocks.listServices,
    serviceAction: mocks.serviceAction,
    SERVICES_QUERY: {
      ...actual.SERVICES_QUERY,
      queryFn: () => mocks.listServices(),
    },
  }
})

import ServicesPage from "./services"

afterEach(cleanup)

function renderPage() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <ServicesPage />
      </MemoryRouter>
    </QueryClientProvider>
  )
}

// Regression (owner-reported): Base UI items ignore Radix-style onSelect —
// clicking an action MUST call the backend action module.
describe("ServicesPage action menu", () => {
  it("fires serviceAction when a menu item is clicked", async () => {
    mocks.listServices.mockResolvedValue([
      {
        id: "svc-1",
        name: "demo",
        version: "0.1.0",
        state: "disabled",
        bound: false,
      },
    ])
    mocks.serviceAction.mockResolvedValue({
      id: "svc-1",
      name: "demo",
      version: "0.1.0",
      state: "pending",
      bound: false,
    })

    renderPage()
    const trigger = await screen.findByRole("button", {
      name: /actions for demo/i,
    })
    fireEvent.click(trigger)
    const item = await screen.findByText("Mark Pending")
    fireEvent.click(item)
    await waitFor(() => {
      expect(mocks.serviceAction).toHaveBeenCalledTimes(1)
      expect(mocks.serviceAction).toHaveBeenCalledWith("svc-1", "pending")
    })
  })
})
