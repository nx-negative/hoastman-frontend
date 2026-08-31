// §2.2 / §9: the admin token lives IN MEMORY ONLY — a module-level variable.
// Never localStorage/sessionStorage/cookies/IndexedDB; it dies with the tab
// (tab close clears it) and `clearAdminToken()` handles logout explicitly.
let adminToken: string | null = null

export function setAdminToken(token: string): void {
  adminToken = token
}

export function getAdminToken(): string | null {
  return adminToken
}

export function clearAdminToken(): void {
  adminToken = null
}

export function hasAdminToken(): boolean {
  return adminToken !== null
}
