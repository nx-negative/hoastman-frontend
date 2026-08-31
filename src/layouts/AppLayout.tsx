import { Suspense } from "react"
import { Outlet } from "react-router"
import { Loader2 } from "lucide-react"

import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { TooltipProvider } from "@/components/ui/tooltip"
import { AppSidebar } from "@/layouts/Sidebar"
import { Topbar } from "@/layouts/Topbar"

function PageLoader() {
  return (
    <div className="flex flex-1 items-center justify-center py-24">
      <Loader2
        aria-label="Loading page"
        className="size-6 animate-spin text-muted-foreground"
      />
    </div>
  )
}

/** Sidebar + topbar shell (§7). Lazy route pages render inside via <Outlet />. */
export function AppLayout() {
  return (
    <SidebarProvider>
      {/* shadcn wrapper already defaults delay=0 (Base UI prop is `delay`). */}
      <TooltipProvider>
        <AppSidebar />
        <SidebarInset>
          <Topbar />
          <main className="flex flex-1 flex-col gap-6 p-4 md:p-6">
            <Suspense fallback={<PageLoader />}>
              <Outlet />
            </Suspense>
          </main>
        </SidebarInset>
      </TooltipProvider>
    </SidebarProvider>
  )
}
