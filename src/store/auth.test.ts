import { afterEach, describe, expect, it, vi } from "vitest"

// §2.2: token store is module state — reset modules between tests so each test
// starts with a clean in-memory store.
afterEach(() => {
  vi.resetModules()
})

describe("in-memory admin token store", () => {
  it("starts empty, stores, and clears — never touching persistence", async () => {
    const auth = await import("./auth")

    expect(auth.hasAdminToken()).toBe(false)
    expect(auth.getAdminToken()).toBeNull()

    auth.setAdminToken("secret")
    expect(auth.getAdminToken()).toBe("secret")
    expect(auth.hasAdminToken()).toBe(true)

    auth.clearAdminToken()
    expect(auth.getAdminToken()).toBeNull()
    expect(auth.hasAdminToken()).toBe(false)
  })
})
