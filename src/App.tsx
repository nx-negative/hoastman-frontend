import { lazy } from "react"
import { Navigate, Route, Routes } from "react-router"

import { ErrorBoundary } from "@/components/error-boundary"
import { RequireAuth } from "@/components/require-auth"
import { AppLayout } from "@/layouts/AppLayout"

// §11: route-level code splitting — the shell loads eagerly, pages are lazy.
const DashboardPage = lazy(() => import("@/routes/dashboard"))
const ServicesPage = lazy(() => import("@/routes/services"))
const LoadTestPage = lazy(() => import("@/routes/load-test"))
const LoginPage = lazy(() => import("@/routes/login"))
// §12 Phase 8: future-feature placeholders.
const CameraPage = lazy(() => import("@/routes/camera"))
const MicrophonePage = lazy(() => import("@/routes/microphone"))
const LocationPage = lazy(() => import("@/routes/location"))
const ScreenViewPage = lazy(() => import("@/routes/screen-view"))
const FullControlPage = lazy(() => import("@/routes/full-control"))

export function App() {
  return (
    // §9: render crashes fall back to a recoverable screen, never a blank page.
    <ErrorBoundary>
      <Routes>
        <Route path="login" element={<LoginPage />} />
        <Route
          element={
            <RequireAuth>
              <AppLayout />
            </RequireAuth>
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="services" element={<ServicesPage />} />
          <Route path="load-test" element={<LoadTestPage />} />
          {/* §12 Phase 8: placeholders — real routes, no dead links. */}
          <Route path="camera" element={<CameraPage />} />
          <Route path="microphone" element={<MicrophonePage />} />
          <Route path="location" element={<LocationPage />} />
          <Route path="screen-view" element={<ScreenViewPage />} />
          <Route path="full-control" element={<FullControlPage />} />
          {/* Unknown URLs must not dead-end. */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Route>
      </Routes>
    </ErrorBoundary>
  )
}

export default App
