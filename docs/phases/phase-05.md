# Phase 5 — Dashboard Core

## What was built
- `routes/dashboard.tsx` — live data page: CPU / Memory / Disk / Process-memory stat cards (accent-coded, metered) + System & Runtime info cards (OS, kernel, arch, CPU model, system uptime, core version, API version, server time, core uptime, git commit)
- `components/status-pill.tsx` — Topbar status pill: `Operational` / `Offline` / `Connecting…`, shared cached query (zero extra requests); click = explicit one-shot refresh
- `components/stat-card.tsx` — presentational §7 card (props only): glow + accent meter via CLI `progress`
- `lib/format.ts` (+ `.test.ts`) — pure formatters: bytes, percent, uptime, server time, commit
- `api/health.ts` — shared query configs (manual fetch: `staleTime: Infinity`, no polling)
- `routes/dashboard.tsx` — Refresh button ("Updated <time>" label) + error-alert Retry drive all refetches
- `styles/globals.css` — `.glow-*` depth utilities (color-mix accent glows)
- vite.config: `advancedChunks` → `codeSplitting` (deprecation fix, 0 warnings restored)

## Data sources (per openapi.json — no invented endpoints)
- `/api/v1/system/health` → status, core_version, uptime, server_time, metrics (Zod-validated)
- `/api/v1/system/info` → os/arch/family, cpu_count/model, git_commit, service_api_version
- **Owner-mandated fetch policy: NO background polling.** Data loads once on first mount; every subsequent fetch is user-triggered (dashboard Refresh button, error-alert Retry, or clicking the topbar status pill). `staleTime: Infinity` + global `refetchOnWindowFocus: false` prevent any automatic re-request; caching means navigating between routes does not re-hit the backend (rate limit: 100 req/10s per IP).
- `metrics: null` → cards render `—` / "Metrics unavailable" (never crashes)

## Checks
- format OK · lint 0 · typecheck 0 · **tests 33/33** · build 0 err / **0 warn**
- Chunks: dashboard 3.15 kB gz; all vendor chunks split, none >89 kB gz
- `dist/` grep for token/backend host/proxy target: **CLEAN**
- Dev smoke: `/login` `/dashboard` `/services` → 200; proxied `/healthz` → 200; no console/server errors

## Commands used
- `bunx --bun shadcn@latest add progress` (CLI only — §8)
- `bun run format && bun run lint && bun run typecheck && bun run test && bun run build`

## Known limitations
- Manual fetch (owner request): numbers are as fresh as the last Refresh click; server time does not tick between fetches
- Charts/trends not in Phase 5 scope (backend exposes point-in-time metrics only)
- Service list rendering is Phase 6 (health endpoint already carries it; UI intentionally not built yet)

## Approval checklist
- [x] Zero build/type/lint errors or warnings
- [x] Zod validation on every field rendered
- [x] Manual fetch policy — zero background requests (owner-mandated; supersedes §11 polling)
- [x] No new deps; `progress` via CLI
- [x] Owner Test Card below

## Owner Test Card (backend running; `bun run dev` → log in)
1. Command: `bun run dev`, open `http://localhost:5173/dashboard`
   Expected: 4 stat cards (CPU/Memory/Disk/Process Memory) with numbers + thin colored meters; System & Runtime cards filled; topbar pill green "Operational"; "Updated HH:MM:SS" label next to the Refresh button.
   Fail: cards show "—" + "Metrics unavailable" → backend metrics source disabled; red "Offline" pill → backend stopped.
2. Command: leave the dashboard idle ~30s with the Network tab open
   Expected: **zero** API requests while idle (manual-fetch policy — no polling, no focus refetch). The "Updated" time does not change.
   Fail: any `/api/v1/system/health` request appears without clicking Refresh → polling regression, report it.
3. Command: click **Refresh** (and edit a file to change nothing — just confirm behavior); then compare values with raw API: `curl -s -H "X-Admin-Token: <token>" http://127.0.0.1:8080/api/v1/system/health | jq '.metrics'`
   Expected: exactly one health + one info request per click; "Updated" time changes; cpu/memory/disk/process numbers and core_version/uptime/server time match the UI.
   Fail: mismatch → report screenshot + jq output.
4. Command: `bun run test`
   Expected: `Tests 33 passed (33)`. Fail: red FAIL block names the test.
5. Command: click the topbar status pill with the backend stopped, then restart the backend and click the pill again
   Expected: pill → red "Offline"; dashboard shows alert "Could not load system data" with Retry; after restart, clicking the pill (or Refresh) turns it green "Operational" and refills the cards.
   Fail: white screen / console stack → capture it.

## Post-approval owner override — neutral default theme (2026-08-31)
- Owner directive: drop §7 glow/depth styling and all accent colors; stock shadcn neutral palette only (owner-pasted light+dark tokens verbatim in src/styles/globals.css).
- Removed: accent-glow / success / warning tokens, glow utility classes, gradient logo + glow shadows (login/sidebar), accent variants on StatCard, sidebar active-accent classes, custom avatar/button colors.
- Radius back to shadcn default `0.625rem` (supersedes the §7 half-radius rule, same owner decision).
- Status pill: Operational = neutral secondary pill; Offline = destructive tint; warning maps to muted. No additional palette.
- Records the same kind of owner-override audit trail as the §2.2 sessionStorage decision.
