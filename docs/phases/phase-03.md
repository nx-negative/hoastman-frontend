# Phase 3 — API Client Layer

## Built
- `src/api/client.ts` — single fetch wrapper (`apiFetch`), `ApiError {status, code, message}`, error-body normalization, `X-Admin-Token` injection, `parseWith()` Zod gate.
- `src/api/schemas.ts` / `types.ts` — Zod schemas mirrored from `docs/backend-api/openapi.json` + README error codes; types derived (`z.infer`) so they can't drift.
- `src/api/queryClient.ts` — global TanStack Query: retry = transient only (network/408/429/503), max 3, backoff 500ms→1s→2s cap; 4xx/500 fail fast; `refetchOnWindowFocus: false` (rate limit).
- `src/store/auth.ts` — in-memory token only (module var; dies with tab; never persisted).
- `src/api/health.ts` (`/healthz`, `/readyz`, `/api/v1/system/health`, `/api/v1/system/info`), `services.ts` (list + 5 actions), `loadTest.ts` (start/cancel/report).
- `src/config.ts` + `src/vite-env.d.ts` — `VITE_API_BASE_URL` (default `http://127.0.0.1:8080` per backend README); `.env.example` corrected to backend default.
- `src/main.tsx` — `QueryClientProvider` wired.
- `vite.config.ts` — vendor chunk split (framework/zod/vendor) to keep all chunks < 500 kB (zero-warning gate, §11 budget).
- Tests: `src/api/client.test.ts` (6 — live HTTP round-trips vs in-test node server), `src/store/auth.test.ts` (1). No new dependencies.

## Checks (all pass)
- `bun run typecheck` → 0 · `bun run lint` → 0 · `bun run test` → 10/10 · `bun run build` → 0 errors, 0 warnings
- Bundle (gz): framework 59.7 + vendor 68.4 + zod 22.4 + app 10.4 + css 11.5 ≈ 162 kB
- Dev smoke: `/dashboard`, `/services`, `/load-test` → 200, no console/server errors

## Owner Test Card
1. Command: `bun run test`
   Expected: `Test Files 3 passed (3)` / `Tests 10 passed (10)` — includes live `/healthz` + `/readyz` round-trips against a throwaway local server (the client layer is exercised for real, not mocked).
   If it fails: red `FAIL` lines naming the test (e.g. `normalizes backend error bodies…`) — copy the first failure block.
2. Command: `bun run dev` then open the three URLs it prints + `/dashboard`, `/services`, `/load-test`
   Expected: same dashboard shell as Phase 2, nothing broken, browser console clean.
   If it fails: blank page or console `Failed to fetch`-style noise → check `.env` exists (`cp .env.example .env`).
3. Command (backend up): `curl -s http://127.0.0.1:8080/healthz`
   Expected: `{"status":"ok"}` — same base URL our client uses via `.env`; UI consumes it from Phase 5.
   If it fails: `Connection refused` → backend isn't running on 8080.

## Known limitations
- `503 admin_disabled` is retried per spec §9 (503 = transient); Phase 4 surfaces it as a session error. Revisit if owner wants it non-retryable.
- Input bounds (duration 1–300 s, sessions 1–256, fps 1–240, payload 1–1024 KB) enforced in Phase 7's form, not in the schema layer.
- UI does not call the API until Phase 5 — this phase is the verified plumbing.

## Approval checklist
- [x] Contract read from `docs/backend-api/*` (12 endpoints, 13 schemas, error codes)
- [x] Zero build/type/lint warnings
- [x] Token in memory only (tested)
- [x] Owner Test Card above
