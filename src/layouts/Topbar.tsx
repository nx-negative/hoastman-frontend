import { useLocation, useNavigate } from "react-router"
import { useQueryClient } from "@tanstack/react-query"
import { LogOut } from "lucide-react"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { StatusPill } from "@/components/status-pill"
import { clearAdminToken } from "@/store/auth"

const TITLES: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/services": "Services",
  "/load-test": "Load Test",
  "/camera": "Camera",
  "/microphone": "Microphone",
  "/location": "Location",
  "/screen-view": "Screen View",
  "/full-control": "Full Control",
}

/**
 * Horizontal topbar (§7): shell context on the left; live status pill + admin
 * session on the right (Phase 5).
 */
export function Topbar() {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const title = TITLES[pathname] ?? "HOSTMAN"

  // §12 Phase 4: drop the session (storage + memory) + any authorized query cache.
  function handleLogout() {
    clearAdminToken()
    queryClient.clear()
    navigate("/login", { replace: true })
  }

  return (
    <header className="sticky top-0 z-10 flex h-14 items-center gap-3 bg-background/80 px-4 backdrop-blur md:px-6">
      <SidebarTrigger className="-ml-1" />
      <Separator
        orientation="vertical"
        className="data-[orientation=vertical]:h-4"
      />
      <h1 className="truncate text-sm font-semibold tracking-tight">{title}</h1>

      <div className="ml-auto flex items-center gap-2">
        <StatusPill />
        <div className="flex items-center gap-2 rounded-full bg-foreground/5 py-1 pr-3 pl-1">
          <Avatar className="size-6">
            <AvatarFallback className="text-[10px] font-bold">
              AD
            </AvatarFallback>
          </Avatar>
          <span className="text-xs font-medium">Admin</span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Log out"
          title="Log out"
          className="size-8 text-muted-foreground hover:text-foreground"
          onClick={handleLogout}
        >
          <LogOut className="size-4" />
        </Button>
      </div>
    </header>
  )
}
