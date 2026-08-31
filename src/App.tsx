import { lazy } from "react"
import { Navigate, Route, Routes } from "react-router"

import { AppLayout } from "@/layouts/AppLayout"

// §11: route-level code splitting — the shell loads eagerly, pages are lazy.
const DashboardPage = lazy(() => import("@/routes/dashboard"))
const ServicesPage = lazy(() => import("@/routes/services"))
const LoadTestPage = lazy(() => import("@/routes/load-test"))

export function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="services" element={<ServicesPage />} />
        <Route path="load-test" element={<LoadTestPage />} />
        {/* Unknown URLs must not dead-end (§12 Phase 8: no dead links). */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Route>
    </Routes>
  )
}

export default App
