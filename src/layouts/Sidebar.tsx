import {
  Boxes,
  Camera,
  Gauge,
  LayoutDashboard,
  MapPin,
  Mic,
  Monitor,
  MousePointerClick,
  Server,
} from "lucide-react"
import { Link, useLocation } from "react-router"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

const NAV_ITEMS = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Services", url: "/services", icon: Boxes },
  { title: "Load Test", url: "/load-test", icon: Gauge },
]

// §12 Phase 8 adds placeholder pages for these — entries stay disabled until
// then so the sidebar never contains dead links.
const UPCOMING_ITEMS = [
  { title: "Camera", icon: Camera },
  { title: "Microphone", icon: Mic },
  { title: "Location", icon: MapPin },
  { title: "Screen View", icon: Monitor },
  { title: "Full Control", icon: MousePointerClick },
]

// §7: active nav item is THE accent surface — tinted translucent fill, accent
// text/icon, soft colored glow. Overrides the shadcn sidebar-accent defaults.
const ACTIVE_CLASSES =
  "data-active:bg-accent-glow-primary/12 data-active:text-accent-glow-primary data-active:shadow-[0_0_16px_-6px_var(--accent-glow-primary)] data-active:hover:bg-accent-glow-primary/12 data-active:hover:text-accent-glow-primary"

/** Vertical sidebar nav (§7). Presentational — active state derives from the URL. */
export function AppSidebar() {
  const { pathname } = useLocation()

  return (
    <Sidebar variant="floating" collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              className="pointer-events-none"
              tabIndex={-1}
            >
              <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-linear-to-br from-accent-glow-primary to-accent-glow-secondary shadow-[0_0_20px_-4px_var(--accent-glow-primary)]">
                <Server className="size-4 text-white" />
              </div>
              <div className="flex min-w-0 flex-col leading-tight">
                <span className="truncate text-sm font-bold tracking-tight">
                  HOSTMAN
                </span>
                <span className="truncate text-xs text-muted-foreground">
                  Admin Panel
                </span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Platform</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {NAV_ITEMS.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    render={<Link to={item.url} />}
                    isActive={pathname.startsWith(item.url)}
                    tooltip={item.title}
                    className={ACTIVE_CLASSES}
                  >
                    <item.icon />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel>Coming Soon</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {UPCOMING_ITEMS.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    disabled
                    tooltip={item.title}
                    className="opacity-60"
                  >
                    <item.icon />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="group-data-[collapsible=icon]:hidden">
        <p className="px-2 pb-1 text-xs text-muted-foreground">
          v0.1.0 — phase 2
        </p>
      </SidebarFooter>
    </Sidebar>
  )
}
