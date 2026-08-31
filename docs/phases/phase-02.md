# Phase 2 — Dashboard Shell (Sidebar + Topbar)

## Built

- `src/layouts/AppLayout.tsx` — `SidebarProvider` + `SidebarInset` shell, sticky blurred topbar, `<Outlet/>` under `Suspense` with spinner fallback.
- `src/layouts/Sidebar.tsx` — floating variant, icon-collapsible; brand block with accent gradient glow; **Platform** group (Dashboard/Services/Load Test, active state from URL, purple accent glow per §7); **Coming Soon** group (Camera/Mic/Location/Screen View/Full Control — disabled, tooltip).
- `src/layouts/Topbar.tsx` — sidebar trigger, route title, neutral status pill placeholder (live in P5), Admin session chip placeholder (real in P4).
- `src/App.tsx` — `Routes` with lazy route pages + wildcard → `/dashboard` redirect (no dead ends).
- `src/main.tsx` — `BrowserRouter` added (client-only, no SSR — §1/§2).
- `src/components/page-header.tsx` — shared presentational header.
- Route pages `dashboard/services/load-test.tsx` — empty themed shells noting future phases.
- shadcn add (CLI): `sidebar`, `tooltip`, `avatar`, `separator`, `sheet`, `skeleton`.
- Fix: `src/hooks/use-mobile.ts` (CLI-generated) — lazy state init replaces sync set-state-in-effect (hard error under react-hooks v7 rule; safe: no SSR, §1).

## Checks (all pass)

- `bun run lint` → 0 errors/warnings · `bun run typecheck` → clean · `bun run test` → 3/3 · `bun run build` → 0 errors/warnings.
- Route splitting confirmed in build output: `dashboard/services/load-test` are separate lazy chunks (~0.7 kB each).
- Dev server: starts clean, all 3 routes HTTP 200, no console/server errors.

## Owner-reported issue: `vite.config.ts` — editor errors (resolved)

- Symptom (owner): errors/squiggles in `vite.config.ts` in the IDE.
- Root cause: `@vitejs/plugin-react@6` exposes its types only via the `exports` map (no legacy root `types` field), and `import.meta.dirname` requires modern module settings. `tsconfig.node.json` (bundler resolution) compiles clean — verified CLI-side in both `bundler` and legacy `node10` modes. Errors therefore came from the editor attaching the file to a *different* program (VS Code inferred project / root `tsconfig.json` fallback) using defaults where `import.meta` is illegal.
- Fix: root `tsconfig.json` hardened with real `compilerOptions` (`module: esnext`, `moduleResolution: bundler`, `target: es2023`, `types: [node]`) so any fallback program still resolves both the plugin types and `import.meta.dirname`.
- Editor action required: reload the TS server after pulling (VS Code → `TypeScript: Restart TS Server` / `Developer: Reload Window`).
- Verified: `tsc` over `vite.config.ts` passes under `bundler` AND `node10` resolution; `bun run typecheck`, `lint`, `build` all still clean; dev server + all routes unaffected.


## Known limitations

- Topbar pill + Admin chip are static placeholders (P4/P5 replace them).
- "Coming Soon" items are disabled buttons (pages arrive P8).
- Sidebar footer version string is manual until P5 wires core version.

## Owner Test Card

1. Command: `bun run dev` → open `http://localhost:5173/`
   - Expect: redirect to `/dashboard`; left floating sidebar (HOSTMAN brand, Platform + Coming Soon groups); topbar with route title, Idle pill, Admin chip.
   - Fail: 404/blank page, flat single-page layout, or default square-gray sidebar.
2. Command: click **Services**, then **Load Test** in sidebar
   - Expect: page content swaps, active item is purple-tinted with soft glow, previous item reverts to muted.
   - Fail: URL changes but sidebar highlight doesn't move, or content doesn't change.
3. Command: click the sidebar toggle in topbar (and shrink window < 768px)
   - Expect: sidebar collapses to icon rail (tooltips on hover); on mobile it becomes an overlay drawer.
   - Fail: layout breaks, page content doesn't reflow, or console errors.
4. Command: `bun run build && bun run preview` → open printed URL, navigate all routes
   - Expect: same behavior as dev; network tab shows separate small chunks per page.
   - Fail: one monolithic JS chunk / navigation does full page reload.
5. Command: `bun run typecheck` (then in VS Code: `TypeScript: Restart TS Server`)
   - Expect: silent exit; `vite.config.ts` shows no import/`import.meta` squiggles in the editor.
   - Fail: `Cannot find name 'import.meta'` or `Cannot find module '@vitejs/plugin-react'` → run `bun install`, restart TS server.

## Approval checklist

- [x] Sidebar + topbar per §7 (floating surfaces, glow accents, half radius)
- [x] React Router wired, lazy routes, wildcard redirect
- [x] Future nav items present + disabled (no dead links)
- [x] Zero lint/type/test/build errors
- [ ] Owner approval
