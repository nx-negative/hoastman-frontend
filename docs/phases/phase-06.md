# Phase 6 — Service Control UI

## Built
- `routes/services.tsx`: service table (name/id, version, Bound badge, state badge, Actions menu) — shadcn CLI `table` + `dropdown-menu` (§8)
- State badges per §10 validation: `enabled`/`disabled`/`pending`/`error` via Zod enum → tinted pill + dot (`pending` pulses); neutral tokens (owner override)
- All 5 backend actions (`start`/`stop`/`pending`/`enable`/`disable`) per row via dropdown → `POST /api/v1/services/{id}/{action}`
- `useMutation` + **refetch-after-action** (list query) so badges match backend; per-row "Working…" busy state; other rows stay enabled
- Errors normalized to fixed copy (`services.helpers.ts`) — 401/404/409/422/429/network; backend internals never echoed (§2.12); inline destructive alert
- Manual-fetch policy (owner, Phase 5): no polling; Refresh button + "Updated" stamp; list loads once on mount
- New tests → **42 total**; fixed `asChild` → `render=` (Base UI shadcn v4 dropdown API)
- Owner-reported crash fixed: `DropdownMenuLabel` must sit inside `DropdownMenuGroup` (Base UI `Menu.GroupLabel` requirement); opening the menu unmounted the whole app → added global `ErrorBoundary` (components/error-boundary.tsx) around the router as a safety net
- Owner-reported no-op fixed: Base UI items fire `onClick`, not Radix's `onSelect` (which only type-checks as a native text-selection event); regression test added (jsdom: click item → `serviceAction` called) — required adding `@testing-library/react` + `jsdom` devDeps

## Changed files
- `src/routes/services.tsx` (page), `src/routes/services.helpers.ts` + test (state maps, action items, error copy), `src/api/services.ts` (query key/options), `src/components/ui/{table,dropdown-menu}.tsx` (CLI)

## How to test / Expected result
See Owner Test Card. Log in with the **current** backend token (the old `2d2b…a23df` token is stale — backend regenerated it; login correctly rejects it).

## Commands used
- `bunx --bun shadcn@latest add table dropdown-menu`
- `bun run format && bun run typecheck && bun run lint && bun run test && bun run build`

## Known limitations
- Backend accepts any action per state (no state-machine gating client-side) — 409/422 rejections surface as the normalized alert.
- Single global "action failed" alert (last failure wins); per-row error cells deferred until needed.

## Fix log (owner-reported crash)
- **Symptom:** opening a row's Actions menu threw `Base UI: MenuGroupContext is missing…` and blanked the whole page.
- **Root cause:** this shadcn v4 registry maps `DropdownMenuLabel` to Base UI `Menu.GroupLabel`, which requires a `Menu.Group` parent.
- **Fix:** label + items now wrapped in `DropdownMenuGroup` (`routes/services.tsx`).
- **Hardening (§9):** added global `components/error-boundary.tsx` around the router in `App.tsx` — any render crash now shows a recoverable "Something went wrong" screen with a Back-to-app button instead of a blank page (class component: React has no hook-based boundary — documented §16 exception).

## Approval checklist
- [x] typecheck 0 · lint 0 · tests 42/42 · build 0 err/0 warn
- [x] `dist/` leak grep clean (no token/host/env)
- [x] Services route lazy chunk (5.2 kB gz)
- [x] Neutral default theme only — no glow/accent hues
- [ ] Owner approval

## Owner Test Card

1. Services list renders
   - Command: `bun run dev` → sign in → click **Services** in sidebar
   - Expected: table with your real services — name/mono id, version, Bound/Unbound badge, state pill; sidebar highlights Services
   - If it fails: red "Could not load services" alert + Retry → backend down or token stale; re-login

1b. Dropdown opens (regression for owner-reported crash)
   - Command: click any row's **Actions** button
   - Expected: menu opens with the service name + 5 items; page never blanks
   - If it fails: `MenuGroupContext is missing` in console = regression; any crash now shows the "Something went wrong" recovery screen instead of a blank page

2. Refetch-after-action (core §12 exit criterion)
   - Command: in UI open a service's **Actions** menu → click **Mark Pending**
   - Expected: menu closes, row shows "Working…", list auto-refreshes, that row's pill changes to pulsing **Pending** — matching `curl -s -H "X-Admin-Token: <token>" http://127.0.0.1:8080/api/v1/services | jq '.services[].state'`
   - If it fails: pill unchanged → check Network tab: one POST then one GET to `/api/v1/services`; missing GET = bug, 401 on POST = stale session (log in again)

3. Full action round-trip
   - Command: **Disable** a service, verify pill; then **Enable** it back
   - Expected: pill flips Disabled ↔ Enabled in sync with the curl above
   - If it fails: destructive red "Action failed — <reason>" alert appears under the header; message matches the backend's response class (rejected/authorized/rate-limited)

4. Error copy (no internals leaked)
   - Command: stop the backend → open Actions → any action (or Refresh)
   - Expected: alert says "Cannot reach the server. Check that the API is running." — no URLs/IPs in the message or console
   - If it fails: any backend host/path/text visible in UI = §2.12 violation, report it

5. Manual-fetch policy still holds
   - Command: sit on Services idle 30 s with Network tab open
   - Expected: zero API requests; clicking **Refresh** fires exactly one GET
   - If it fails: periodic requests appearing = polling regression

6. Gates
   - Command: `bun run test`
   - Expected: `Tests  42 passed (42)`
   - If it fails: red FAIL block names the helper
