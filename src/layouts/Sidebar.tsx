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

// §12 Phase 8: placeholder pages exist for these — items navigate (no dead
// links); each page itself is clearly marked disabled/"coming soon".
const UPCOMING_ITEMS = [
  { title: "Camera", url: "/camera", icon: Camera },
  { title: "Microphone", url: "/microphone", icon: Mic },
  { title: "Location", url: "/location", icon: MapPin },
  { title: "Screen View", url: "/screen-view", icon: Monitor },
  { title: "Full Control", url: "/full-control", icon: MousePointerClick },
]

/** Vertical sidebar nav (§7 layout). Presentational — active state derives from the URL. */
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
              <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground">
                <Server className="size-4" />
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
                    render={<Link to={item.url} />}
                    isActive={pathname.startsWith(item.url)}
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
        <p className="px-2 pb-1 text-xs text-muted-foreground">v0.1.0</p>
      </SidebarFooter>
    </Sidebar>
  )
}
