import { useLocation } from "react-router"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"

const TITLES: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/services": "Services",
  "/load-test": "Load Test",
}

/**
 * Horizontal topbar (§7): shell context on the left; status pill + admin
 * session on the right. Pill and session are placeholders — live backend
 * status lands in Phase 5, real session/logout in Phase 4 (§12).
 */
export function Topbar() {
  const { pathname } = useLocation()
  const title = TITLES[pathname] ?? "HOSTMAN"

  return (
    <header className="sticky top-0 z-10 flex h-14 items-center gap-3 bg-background/80 px-4 backdrop-blur md:px-6">
      <SidebarTrigger className="-ml-1" />
      <Separator
        orientation="vertical"
        className="data-[orientation=vertical]:h-4"
      />
      <h1 className="truncate text-sm font-semibold tracking-tight">{title}</h1>

      <div className="ml-auto flex items-center gap-2">
        {/* Neutral placeholder — semantic pill styling per §7 once data is live. */}
        <span className="inline-flex items-center gap-1.5 rounded-full bg-foreground/5 px-2.5 py-1 text-xs font-medium text-muted-foreground">
          <span className="size-1.5 rounded-full bg-muted-foreground/60" />
          Idle
        </span>
        <div className="flex items-center gap-2 rounded-full bg-foreground/5 py-1 pr-3 pl-1">
          <Avatar className="size-6">
            <AvatarFallback className="bg-accent-glow-primary/15 text-[10px] font-bold text-accent-glow-primary">
              AD
            </AvatarFallback>
          </Avatar>
          <span className="text-xs font-medium">Admin</span>
        </div>
      </div>
    </header>
  )
}
