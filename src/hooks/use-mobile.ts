import * as React from "react"

const MOBILE_BREAKPOINT = 768

export function useIsMobile() {
  // SPA only (no SSR, §1) — safe to read window at init. Lazy init + effect that
  // only subscribes: the sync set-state-in-effect form trips the strict
  // react-hooks/set-state-in-effect rule (plugin v7).
  const [isMobile, setIsMobile] = React.useState(
    () => window.innerWidth < MOBILE_BREAKPOINT
  )

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    }
    mql.addEventListener("change", onChange)
    return () => mql.removeEventListener("change", onChange)
  }, [])

  return isMobile
}
