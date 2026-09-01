# Phase 8 — Future Feature Placeholders

## What was built
- `components/feature-placeholder.tsx` — shared presentational placeholder: icon, **"Coming soon"** badge, muted explainer, and the three reserved §24 states (Permission / Connection / Error) as preview rows. No controls, no fetching (§6).
- 5 lazy route files (`src/routes/`): `camera.tsx`, `microphone.tsx`, `location.tsx`, `screen-view.tsx`, `full-control.tsx`.
- `App.tsx`: 5 lazy routes (§11 code splitting) under the auth guard.
- `Sidebar.tsx`: Coming-Soon items are now **real links** (no dead links) — still visually muted (`opacity-60`); active item highlights.
- `Topbar.tsx`: titles for all 5 new paths.
- Test: `feature-placeholder.test.tsx` (badge + reserved states render; **no buttons** anywhere).

## Owner-approved deviations
- §7 spec originally placed these in a disabled sidebar group; owner directive makes them navigable placeholder pages (muted styling kept to signal "not ready").

## Owner Test Card
1. Command: `bun run dev` → sign in → click **Camera** in the sidebar.
   Expected: URL `/camera`, topbar title **Camera**, sidebar Camera item highlighted, page shows icon + "Coming soon" badge + Permission/Connection/Error rows. Failure: blank page, wrong title, or a console error.
2. Command: visit `/microphone`, `/location`, `/screen-view`, `/full-control` (sidebar or direct URL).
   Expected: same placeholder pattern per feature; zero console errors/warnings. Failure: 404 redirect to dashboard or console noise.
3. Command: sign out, paste `http://localhost:5173/full-control`.
   Expected: redirect to `/login` (guard covers placeholders). Failure: page visible without a session.
4. Command: `bun run test`.
   Expected: `Tests 66 passed (66)`. Failure: any red FAIL block.
5. Command: `bun run build`.
   Expected: 0 errors/0 warnings; 5 new small chunks in the output. Failure: build error or oversized bundle warning.

## Known limitations
- Pages are intentionally inert — no API/permission logic (backend has none yet, §24 reserved).

## Commands used
- shadcn: none needed (Badge/Card already CLI-managed).
- `bun run format / typecheck / lint / test / build`

## Approval checklist
- [x] Nav items navigate; no dead links; clearly-disabled pages
- [x] Zero console errors on all 5 routes
- [x] Auth guard applies to placeholders
- [x] Owner Test Card above
