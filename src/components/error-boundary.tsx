import { Component, type ErrorInfo, type ReactNode } from "react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"

interface ErrorBoundaryProps {
  children: ReactNode
}

interface ErrorBoundaryState {
  error: Error | null
}

/**
 * Global error boundary (§9): a render-time crash anywhere in the SPA falls
 * back to a recoverable screen instead of a blank page. Class component is
 * required — React has no hook-based error boundary, so the React Compiler
 * cannot cover this case (documented §16 exception). No error details are
 * shown beyond the message: backend internals must never leak (§2.12).
 */
export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = { error: null }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    // Console-only diagnostics for the admin; never rendered from API data.
    console.error("Unhandled UI error:", error, info.componentStack)
  }

  render() {
    if (this.state.error) {
      return (
        <div className="flex min-h-svh items-center justify-center p-6">
          <div className="w-full max-w-md">
            <Alert variant="destructive">
              <AlertTitle>Something went wrong</AlertTitle>
              <AlertDescription>
                The interface hit an unexpected error and recovered. Your
                session is still active — reload to continue.
              </AlertDescription>
            </Alert>
            <Button
              className="mt-4 w-full"
              onClick={() => {
                this.setState({ error: null })
              }}
            >
              Back to the app
            </Button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
