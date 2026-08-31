import { afterEach, describe, expect, it, vi } from "vitest"

// §2.2 (owner override): token store is backed by sessionStorage — reset
// modules between tests so each test starts with a clean store and storage.
afterEach(() => {
  vi.resetModules()
})

interface FakeStorage {
  store: Record<string, string>
  getItem: (k: string) => string | null
  setItem: (k: string, v: string) => void
  removeItem: (k: string) => void
  clear: () => void
  key: (i: number) => string | null
  length: number
}

function makeStorage(): FakeStorage {
  const store: Record<string, string> = {}
  return {
    store,
    getItem: (k) => (k in store ? store[k] : null),
    setItem: (k, v) => {
      store[k] = String(v)
    },
    removeItem: (k) => {
      delete store[k]
    },
    clear: () => {
      for (const k in store) delete store[k]
    },
    key: (i) => Object.keys(store)[i] ?? null,
    get length() {
      return Object.keys(store).length
    },
  }
}

/** Install fake localStorage/sessionStorage, run, then restore. */
function withStorage(
  setup: (s: {
    localStorage: FakeStorage
    sessionStorage: FakeStorage
  }) => Promise<void>
): Promise<void> {
  const localStorage = makeStorage()
  const sessionStorage = makeStorage()
  const origLs = (globalThis as { localStorage?: unknown }).localStorage
  const origSs = (globalThis as { sessionStorage?: unknown }).sessionStorage
  ;(globalThis as { localStorage: unknown }).localStorage = localStorage
  ;(globalThis as { sessionStorage: unknown }).sessionStorage = sessionStorage
  return setup({ localStorage, sessionStorage }).finally(() => {
    ;(globalThis as { localStorage?: unknown }).localStorage = origLs
    ;(globalThis as { sessionStorage?: unknown }).sessionStorage = origSs
  })
}

describe("admin token store (sessionStorage persisted)", () => {
  it("hydrates a previously-verified token on reload", async () => {
    await withStorage(async (s) => {
      s.sessionStorage.setItem("hostman_admin_token", "persisted-token")
      vi.resetModules()
      const auth = await import("./auth")
      expect(auth.getAdminToken()).toBe("persisted-token")
      expect(auth.hasAdminToken()).toBe(true)
    })
  })

  it("starts empty when no token is stored", async () => {
    await withStorage(async () => {
      vi.resetModules()
      const auth = await import("./auth")
      expect(auth.getAdminToken()).toBeNull()
      expect(auth.hasAdminToken()).toBe(false)
    })
  })

  it("writes the token to sessionStorage and NOT localStorage", async () => {
    await withStorage(async (s) => {
      vi.resetModules()
      const auth = await import("./auth")
      auth.setAdminToken("secret")
      expect(s.sessionStorage.getItem("hostman_admin_token")).toBe("secret")
      expect(s.localStorage.getItem("hostman_admin_token")).toBeNull()

      auth.clearAdminToken()
      expect(s.sessionStorage.getItem("hostman_admin_token")).toBeNull()
      expect(s.localStorage.getItem("hostman_admin_token")).toBeNull()
    })
  })

  it("readStoredToken inspects storage without mutating the live store", async () => {
    await withStorage(async (s) => {
      vi.resetModules()
      const auth = await import("./auth")
      s.sessionStorage.setItem("hostman_admin_token", "peeked")
      expect(auth.readStoredToken()).toBe("peeked")
      // peeking storage must NOT populate the live store
      expect(auth.hasAdminToken()).toBe(false)
    })
  })
})

describe("reactive session (§4 bypass fix)", () => {
  // These tests exercise pure reactivity. Storage is cleared first (when the
  // environment provides it) and modules reset, so hydration cannot pick up a
  // leftover token from an earlier test.
  it("subscribers fire on set and clear", async () => {
    globalThis.sessionStorage?.clear()
    globalThis.localStorage?.clear()
    vi.resetModules()
    const auth = await import("./auth")
    const log: string[] = []
    const unsub = auth.subscribe(() =>
      log.push(auth.getAdminToken() ?? "~cleared~")
    )

    auth.setAdminToken("secret")
    auth.clearAdminToken()
    expect(log).toEqual(["secret", "~cleared~"])
    unsub()

    // no notifications after unsubscribe
    auth.setAdminToken("again")
    expect(log).toEqual(["secret", "~cleared~"])
  })

  it("clear when already empty is a no-op (no spurious notifications)", async () => {
    globalThis.sessionStorage?.clear()
    globalThis.localStorage?.clear()
    vi.resetModules()
    const auth = await import("./auth")
    let calls = 0
    const unsub = auth.subscribe(() => calls++)

    auth.clearAdminToken() // null→null → no emit
    expect(calls).toBe(0)

    auth.setAdminToken("t")
    auth.clearAdminToken()
    expect(calls).toBe(2) // set + clear are both real transitions
    unsub()
  })
})
