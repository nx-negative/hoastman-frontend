import { QueryClient } from "@tanstack/react-query"

import { isRetryable, retryDelay } from "./client"

/**
 * Global TanStack Query instance (§9). Retry policy lives here so every query
 * inherits it: transient failures retried up to 3 tries with capped backoff;
 * 4xx/500 surface immediately. Mutations are NOT retried by default.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => failureCount < 3 && isRetryable(error),
      retryDelay,
      // Admin tool: polling-driven; avoid surprise refetch bursts against the
      // backend's per-IP rate limit (100 req / 10 s).
      refetchOnWindowFocus: false,
    },
  },
})
