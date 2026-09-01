import { useMutation, useQuery } from "@tanstack/react-query"
import { ChevronDown, RefreshCw } from "lucide-react"
import { useState } from "react"

import { PageHeader } from "@/components/page-header"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { SERVICES_QUERY, serviceAction } from "@/api/services"
import type { ServiceAction } from "@/api/services"
import type { Service } from "@/api/types"
import { formatServerTime } from "@/lib/format"
import { cn } from "@/lib/utils"
import {
  ACTION_ITEMS,
  getActionErrorMessage,
  STATE_LABELS,
  stateBadgeClasses,
  stateDotClasses,
  stateDotPulse,
} from "./services.helpers"

/**
 * Service control UI (§12 Phase 6). Route owns data fetching (§6): the list
 * loads once on mount (manual-fetch policy — no polling) and is refetched via
 * the Refresh button or automatically after a successful action.
 */
export default function ServicesPage() {
  const servicesQuery = useQuery({ ...SERVICES_QUERY })
  const [actionError, setActionError] = useState<{
    name: string
    message: string
  } | null>(null)

  const actionMutation = useMutation({
    mutationFn: (vars: { id: string; name: string; action: ServiceAction }) =>
      serviceAction(vars.id, vars.action),
    // §12 Phase 6: refetch-after-action so state badges match the backend.
    onSuccess: () => {
      setActionError(null)
      void servicesQuery.refetch()
    },
    onError: (error, vars) => {
      setActionError({ name: vars.name, message: getActionErrorMessage(error) })
    },
  })
  const busyId = actionMutation.isPending
    ? (actionMutation.variables?.id ?? null)
    : null

  const isFetching = servicesQuery.isFetching

  function handleRefresh() {
    void servicesQuery.refetch()
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <PageHeader
          title="Services"
          description="Start, stop, enable, and disable monitored services."
        />
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground tabular-nums">
            {servicesQuery.dataUpdatedAt > 0
              ? `Updated ${formatServerTime(servicesQuery.dataUpdatedAt)}`
              : "Not loaded yet"}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={isFetching}
            onClick={handleRefresh}
          >
            <RefreshCw className={cn("size-4", isFetching && "animate-spin")} />
            Refresh
          </Button>
        </div>
      </div>

      {actionError ? (
        <Alert variant="destructive">
          <AlertTitle>Action failed</AlertTitle>
          <AlertDescription>
            <span className="font-medium">{actionError.name}</span> —{" "}
            {actionError.message}
          </AlertDescription>
        </Alert>
      ) : null}

      {servicesQuery.isError ? (
        <Alert variant="destructive">
          <AlertTitle>Could not load services</AlertTitle>
          <AlertDescription>
            The API server did not respond to the last request.
          </AlertDescription>
          <Button
            variant="outline"
            size="sm"
            className="mt-3"
            onClick={handleRefresh}
          >
            <RefreshCw /> Retry
          </Button>
        </Alert>
      ) : (
        <div className="overflow-hidden rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Service</TableHead>
                <TableHead>Version</TableHead>
                <TableHead>Binding</TableHead>
                <TableHead>State</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {servicesQuery.isPending ? (
                <SkeletonRows />
              ) : servicesQuery.data.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="h-24 text-center text-muted-foreground"
                  >
                    No services registered.
                  </TableCell>
                </TableRow>
              ) : (
                servicesQuery.data.map((service) => (
                  <ServiceRow
                    key={service.id}
                    service={service}
                    busy={busyId === service.id}
                    disabled={actionMutation.isPending}
                    onAction={(action) => {
                      actionMutation.mutate({
                        id: service.id,
                        name: service.name,
                        action,
                      })
                    }}
                  />
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}

function SkeletonRows() {
  return (
    <>
      {[0, 1, 2].map((row) => (
        <TableRow key={row}>
          {[0, 1, 2, 3, 4].map((cell) => (
            <TableCell key={cell}>
              <Skeleton className="h-4 w-full" />
            </TableCell>
          ))}
        </TableRow>
      ))}
    </>
  )
}

interface ServiceRowProps {
  service: Service
  busy: boolean
  disabled: boolean
  onAction: (action: ServiceAction) => void
}

function ServiceRow({ service, busy, disabled, onAction }: ServiceRowProps) {
  const state = service.state
  return (
    <TableRow>
      <TableCell>
        <div className="flex flex-col">
          <span className="font-medium">{service.name}</span>
          <span className="font-mono text-xs text-muted-foreground">
            {service.id}
          </span>
        </div>
      </TableCell>
      <TableCell className="font-mono text-xs text-muted-foreground">
        {service.version}
      </TableCell>
      <TableCell>
        <Badge variant={service.bound ? "secondary" : "outline"}>
          {service.bound ? "Bound" : "Unbound"}
        </Badge>
      </TableCell>
      <TableCell>
        <span
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium",
            stateBadgeClasses(state)
          )}
        >
          <span
            className={cn(
              "size-1.5 rounded-full",
              stateDotClasses(state),
              stateDotPulse(state) && "animate-pulse"
            )}
          />
          {STATE_LABELS[state]}
        </span>
      </TableCell>
      <TableCell className="text-right">
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                variant="ghost"
                size="sm"
                disabled={disabled}
                aria-label={`Actions for ${service.name}`}
              >
                {busy ? "Working…" : "Actions"}
                <ChevronDown className="size-4" />
              </Button>
            }
          />
          <DropdownMenuContent align="end" className="w-44">
            <DropdownMenuGroup>
              <DropdownMenuLabel>{service.name}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {ACTION_ITEMS.map((item) => (
                <DropdownMenuItem
                  key={item.action}
                  variant={item.destructive ? "destructive" : "default"}
                  disabled={busy}
                  // Base UI menu items fire onClick (Radix's onSelect does
                  // not exist here — it only type-checks as a native event).
                  onClick={() => {
                    onAction(item.action)
                  }}
                >
                  {item.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  )
}
