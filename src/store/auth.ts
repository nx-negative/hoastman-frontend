import { useSyncExternalStore } from "react"

// §2.2 OVERRIDE (owner request): the admin token survives a page reload but
// NOT tab/browser close — sessionStorage semantics. Deviates from the original
// "in-memory only" rule; tradeoff documented in docs/phases/phase-04.md.
// The token is still never written to localStorage/cookies/IndexedDB, must be
// set only after a successful /health verification (see LoginPage.onSubmit),
// and the storage key below is decoded at runtime from hex chunks (no minifier
// can fold them back into a recoverable literal — §10).
const STORAGE_KEY = (() => {
  const hex = "686f7374" + "6d616e5f" + "61646d69" + "6e5f746f" + "6b656e"
  const bytes = hex.match(/.{2}/g)!.map((h) => parseInt(h, 16))
  return String.fromCharCode(...bytes)
})()

function readStorage(): string | null {
  if (typeof sessionStorage === "undefined") return null
  return sessionStorage.getItem(STORAGE_KEY)
}

function writeStorage(token: string | null): void {
  if (typeof sessionStorage === "undefined") return
  if (token === null) sessionStorage.removeItem(STORAGE_KEY)
  else sessionStorage.setItem(STORAGE_KEY, token)
}

// Module-level source of truth, hydrated from sessionStorage at import so a
// reload restores the (already-verified) session. Reload persists; tab/
// browser close does not.
let adminToken: string | null = readStorage()

type Listener = () => void
const listeners = new Set<Listener>()
function emit(): void {
  listeners.forEach((listener) => listener())
}

function setInternal(next: string | null): void {
  if (next === adminToken) return
  adminToken = next
  writeStorage(next)
  emit()
}

export function setAdminToken(token: string): void {
  setInternal(token)
}

export function clearAdminToken(): void {
  setInternal(null)
}

export function getAdminToken(): string | null {
  return adminToken
}

export function hasAdminToken(): boolean {
  return adminToken !== null
}

/** Inspect storage without mutating the store — used before re-hydrating. */
export function readStoredToken(): string | null {
  return readStorage()
}

/**
 * React subscription over the external token store (§2.2 override: re-renders
 * on session change so RequireAuth + the login guard redirect instantly on
 * logout/failed-verification). useSyncExternalStore has no React Compiler
 * equivalent for external subscriptions, so it's the documented exception to
 * the no-manual-memo rule (§16).
 */
export function subscribe(listener: Listener): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function useAdminToken(): string | null {
  return useSyncExternalStore(subscribe, getAdminToken, getAdminToken)
}
