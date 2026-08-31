# Phase 4 — Auth / Login Flow

## Built
- `src/routes/login.tsx` — sign-in page: TanStack Form (`onChange` Zod validation), token field (password input), submit verifies against `GET /api/v1/system/health` (admin-gated, §12 Phase 4 exit criterion), success → redirect to `state.from` or `/dashboard`
- `src/routes/login.helpers.ts` — `loginSchema` (Zod, trims + requires non-empty), `getLoginErrorMessage()` mapping `401` / `admin_disabled` / `429 rate_limited` / `network(0)` → owner-facing copy; never echoes backend messages (§2.12, unit-tested)
- `src/components/require-auth.tsx` — route gate: no session token → redirect `/login` (preserves attempted path)
- `src/App.tsx` — `/login` public route; `AppLayout` wrapped in `RequireAuth`
- `src/layouts/Topbar.tsx` — logout button: clears the token store **and** QueryClient cache, navigates to `/login`
- shadcn CLI adds: `input`, `label`, `alert` (§8)
- Token committed to the store only AFTER successful verification (§2.2 hardening)
- 8 new unit tests (error mapping, no-host-leak assertion, schema) → 18 total

## Checks
- `bun run typecheck` → 0 errors (TS7 via `tsc -b`)
- `bun run lint` → 0 errors/warnings
- `bun run test` → 26/26
- `bun run build` → 0 errors/warnings; login page split as own chunk (7.75 kB / 2.6 kB gz)
- Dev smoke: `/login`, `/dashboard`, `/` → 200, no console/server errors

## Known limitations
- Session survives page reload via `sessionStorage` (owner override of §2.2 in this phase); a tab or browser close clears it.
- `admin_disabled` styling is a plain destructive alert; per §7 fine for MVP

## Fix during owner testing — CORS preflight rejection
- Symptom: correct token flashed the dashboard, then bounced to `/login`; later attempts said "Cannot reach the server."
- Root cause (Network tab): browser preflight `OPTIONS /api/v1/system/health` → backend returns **401 with no `Access-Control-Allow-Origin`** — preflights never carry `X-Admin-Token`, so they can never authenticate. Backend CORS gap, not a frontend bug.
- Fix (frontend, no backend change): dev API traffic proxied via `vite.config.ts` `server.proxy` (`/api`, `/healthz`, `/readyz` → target from `.env` `API_PROXY_TARGET`, server-side only); `src/config.ts` is a same-origin constant — the client never reads or embeds the backend origin (§10: verified — grep of `dist/` finds no host). Matches the §15 same-origin prod topology. `VITE_API_BASE_URL` remains a fallback proxy target for spec (§4) compatibility but is never exposed to client code.
- Verified end-to-end through the proxy with a mock backend: valid token → `200 {"status":"ok"}`, wrong token → `401 {"error":{"code":"unauthorized",...}}` (same-origin GETs — no preflight exists to reject).
- Backend-side note (owner): add `OPTIONS` + `Access-Control-Allow-*` handling if a split-origin deployment is ever wanted.
- Verified end-to-end against the **live** backend through the proxy: valid token → `200 {"status":"ok",...}`, wrong token → `401 {"error":{"code":"unauthorized",...})` (same-origin GETs — no preflight exists to reject).

## Post-testing security fix — pre-verification bypass

- Symptom: wrong token on 1st click → "Invalid admin token." but a 2nd click landed on the dashboard with **any** token; session/reload behavior was inconsistent.
- Root cause: `setAdminToken(token)` wrote the **unverified** token into the in-memory store *before* `getSystemHealth()` resolved. The resulting state-set re-rendered `LoginPage` while the fetch was still in flight, so the `if (hasAdminToken())` guard emitted `<Navigate to="/dashboard">` on an unverified token. The rejected fetch cleared the token only later — with no React re-render (the store was non-reactive), so `RequireAuth` never redirected and the user sat on `/dashboard` with an empty store.
- Fix (frontend only):
  - `apiFetch` / `getSystemHealth` accept an explicit `token` argument (§9) so login verifies a token **without ever touching the global store**.
  - `LoginPage.onSubmit` calls `setAdminToken(token)` **only after** `/api/v1/system/health` resolves successfully.
  - Auth store is now reactive (`useAdminToken` via `useSyncExternalStore`): `RequireAuth` + the login guard redirect instantly on logout/clear; `clearAdminToken()` when already empty emits no notification. (`useSyncExternalStore` has no React-Compiler equivalent — §16 documented exception.)
  - `fetch` is invoked with `cache: "no-store"` to preclude any cross-request cache reuse for bearer-style custom-header auth (§9/§10).
- Verified: valid token → 200 full health payload; wrong token → 401; `/login` → 200. Regression tests added (`auth.test.ts`: reactivity + no-storage; `client.test.ts`: explicit-token override + store fallback; `login.test.ts`: 502/504 offline mapping).

## Owner-approved §2.2 override — sessionStorage session

- Owner request (recorded per §13): "set the token to session storage … after reload it should stay but after closing the tab or browser the token must remove" — exactly `sessionStorage` semantics, explicitly overriding the original §2.2 "in-memory only" rule.
- Implementation (`src/store/auth.ts`): the store hydrates from `sessionStorage["hostman_admin_token"]` at module load (a reload restores the already-verified session); every set/clear mirrors to storage; `clearAdminToken()` removes it. By browser contract, `sessionStorage` is purged on tab/browser close — no timer needed. Only the storage **key name** is a literal — the token value is never in source or bundle.
- Still enforced: never localStorage/cookies/IndexedDB; token committed only after successful `/api/v1/system/health` verification (`login.tsx` is unchanged — verify-then-set — so persistence is transparent to the bypass fix above); logout clears storage; §10 leak grep on `dist/` clean.
- Security tradeoff (documented for the override): a successful XSS, or someone with local access to the unlocked tab, could read the sessionStorage token until the tab closes. Mitigations: strict CSP (Phase 9), React default escaping everywhere, HTTPS in deployment (Phase 10). Revisit if the threat model changes.
- Tests: store contract rewritten — hydrate-on-reload, empty-start, sessionStorage-not-localStorage writes, `readStoredToken` no-mutation, reactivity regressions — 26/26.

## Fix — build chunk warning regression

- Symptom: `index` chunk ballooned to 519 kB (>500 kB warning; violates rule 2.7 zero-warnings).
- Root cause: the Phase 4 config rewrite used `manualChunks`, which rolldown-vite silently ignores (Phase 3 used the Rolldown-native `advancedChunks` API).
- Fix: restored `rolldownOptions.output.advancedChunks` groups (framework/zod/vendor) alongside the proxy config. Build: 0 warnings; largest chunk 273 kB (85 kB gz).

## Commands used
- `bunx --bun shadcn@latest add input label alert`
- `bun run typecheck && bun run lint && bun run test && bun run build`

## Owner Test Card

**Prereq:** backend running on the `.env` `API_PROXY_TARGET` target (dev requests are proxied to it — same-origin, no CORS), then `bun run dev`.

1. Guard + login page
   - Command: open `http://localhost:5173/dashboard` (fresh tab, not logged in)
   - Expected: redirected to `/login`; centered HOSTMAN card, purple glow, token field
   - Fails: dashboard content visible without signing in
2. Wrong token
   - Command: type `wrong-token` → "Sign in"
   - Expected: red alert "Invalid admin token." — DevTools → Application → Storage shows **no** localStorage/sessionStorage/cookie entry; request header `X-Admin-Token` visible in Network tab only (in-memory)
   - Fails: alert says something else, or a storage entry appears, or page crashes
3. Correct token
   - Command: clear field, paste real admin token → "Sign in"
   - Expected: button shows "Verifying…", then lands on `/dashboard`; topbar shows Admin pill + logout icon; DevTools → Application → Session Storage shows `hostman_admin_token` (owner-approved override)
   - Fails: stuck on "Verifying…", error alert, or blank page
4. Logout
   - Command: click the logout icon (top-right)
   - Expected: back at `/login`; pressing browser Back returns to `/login` again (cache cleared, guard active)
   - Fails: Back shows dashboard with data
5. Offline behavior
   - Command: stop backend, sign in with any token
   - Expected: "Cannot reach the server." (the dev proxy surfaces a stopped backend as 502 → mapped to offline copy; verification failed → token never committed — Storage tab stays empty)
   - Fails: generic "Sign-in failed." / unhandled error / blank screen / backend host shown in the message
6. Session persistence (owner-approved override)
   - Command: after signing in, press F5 (reload)
   - Expected: dashboard remains — no redirect to `/login`; Session Storage still shows `hostman_admin_token`
   - Fails: reload bounces to `/login`
   - Command: close the tab entirely, reopen `http://localhost:5173/dashboard`
   - Expected: redirected to `/login` (the token died with the tab)
   - Fails: dashboard renders without signing in

## Approval checklist
- [x] Exit criterion: wrong token → error; correct token → dashboard
- [x] Token lifecycle per owner-approved §2.2 override: sessionStorage only — survives reload, dies with tab/browser close; never localStorage/cookies/IndexedDB (tests + Test Card steps 2/6)
- [x] `admin_disabled` / 401 / 429 / network all handled
- [x] No new dependencies; gate clean
