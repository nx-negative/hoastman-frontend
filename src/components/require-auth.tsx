import type { ReactNode } from "react"
import { Navigate, useLocation } from "react-router"

import { useAdminToken } from "@/store/auth"

/**
 * Auth gate (§12 Phase 4): renders children only with an active session
 * (sessionStorage-backed, §2.2 owner override); otherwise redirects to /login
 * preserving the attempted URL via location.state.
 * Subscribes reactively (§4 fix) so logout/failed verification redirects
 * instantly without a reload.
 */
export function RequireAuth({ children }: { children: ReactNode }) {
  const location = useLocation()
  const token = useAdminToken()

  if (!token) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }
  return <>{children}</>
}
