# HOSTMAN-FRONTEND Agent Directive

**Project name:** HOSTMAN
**Frontend name:** HOSTMAN-FRONTEND
**Consumes:** HOSTMAN-BACKEND API (see `docs/backend-api/openapi.json`, `docs/backend-api/README.md`, `docs/backend-api/frontend-guide.md` — copy these three files into this repo before Phase 1).

This file is the final instruction for AI agents. Follow it strictly. Do not expand scope. Do not burn tokens. Work phase by phase. Do not move to the next phase until current phase is approved.

**Stack change note:** This project previously targeted SolidJS and was rebuilt on React due to ecosystem/tooling friction. This is the current and only spec — do not reference or revive the SolidJS version.

---

## 1. Mission

Build a production-grade admin control panel frontend named `HOSTMAN-FRONTEND`.

This frontend must be:

- Client-side SPA with real multi-route navigation (React Router) — **no SSR, no SEO** (private admin tool; SSR/SEO surface area is a security risk here, confirmed by owner).
- React + Vite + React Compiler + TypeScript (v7).
- shadcn/ui as the component foundation, themed to a modern dark SaaS dashboard (see §7).
- A real dashboard layout: **vertical sidebar nav + horizontal top navbar** — not a single flat page.
- Fully type-safe end to end (types derived from backend's `openapi.json`, validated at runtime with Zod).
- Modern stack: TanStack Query (data fetching/caching), TanStack Form (forms), Zod (schema validation), React Router (routing).
- Z+ security: no token persistence, strict CSP, no secret leakage, no exposed API internals.
- Heavily optimized despite React's larger ecosystem — React Compiler for auto-memoization, lazy route loading, careful dependency budget.

---

## 2. Non-Negotiable Rules

1. No SSR. No SEO meta/sitemap/robots work of any kind. Pure client-side SPA.
2. Admin token lives **in memory only** — never localStorage, sessionStorage, cookies, or IndexedDB.
3. No secrets, tokens, or API internals in source code, build output, or client bundle.
4. No `eval`, no `new Function`, no unsanitized `dangerouslySetInnerHTML`.
5. Strict CSP; no inline scripts/styles that defeat CSP.
6. TypeScript strict mode on (TS v7). No `any` unless justified with a comment.
7. Each phase must ship with zero build errors, zero type errors, zero lint warnings.
8. Each phase must have its own `docs/phases/phase-XX.md`.
9. Do not start next phase until current phase is approved by owner.
10. After owner approval, push phase code to Git.
11. Keep token usage extremely low — short bullets, no restated requirements, no fluff.
12. Never expose backend host/IP/internal details in the DOM, console, or client-visible errors.
13. No dependency added without clear purpose — audit bundle size impact before adding.
14. Clean, professional folder structure (§6). No dumping files at root.
15. Design must match §7 spec — modern dark SaaS dashboard with sidebar+topbar, "10/10" visual polish — not default/templated/flat-bordered look.
16. Use React Compiler — do not hand-write manual `useMemo`/`useCallback` optimization unless the compiler genuinely can't cover a case (document why).

---

## 3. Token Efficiency Rules

- Short bullet points, no restated requirements, no obvious explanations.
- Don't output full file content unless explicitly needed — prefer diffs/paths/commands.
- One phase at a time. No future-phase code early.
- If a checklist/command is enough, don't write prose.
- Ask only one concise question if blocked.

---

## 4. Assumptions

- Git provider: GitHub. New separate repo: `HOSTMAN-FRONTEND` (fresh repo, replaces the SolidJS attempt).
- Backend runs separately (`HOSTMAN-BACKEND`), reachable via `VITE_API_BASE_URL`.
- No SEO, no public marketing pages, no multi-tenant public signup.
- Single admin persona for now (matches backend's current admin-only scope).
- Deployment targets: Windows RDP and Linux RDP/server, few-click bootstrap — same as backend.
- Owner has limited frontend build/deploy experience — every phase needs an Owner Test Card (§16).
- Owner already has a shadcn theme built via the `shadcn` CLI init — see §5 exact command.

---

## 5. Technology Requirements

Verify latest stable versions before coding; record in `docs/versions.md`.

Core stack:

- React (latest stable) + **React Compiler** enabled
- Vite (latest stable)
- TypeScript **v7** (strict mode)
- Bun (latest stable) — package manager + dev/build runtime
- **React Router** (latest stable) — client-side routing only, no SSR/data-router-server-features
- **shadcn/ui** — initialize with the owner's exact preset:
  ```
  bunx --bun shadcn@latest init --preset b1D0dv72 --template vite --pointer
  ```
  Do not re-theme from scratch — owner's theme/tokens come from this preset. Extend, don't replace.
- Tailwind CSS (comes with shadcn init)
- `@tanstack/react-query` — data fetching/caching/polling
- `@tanstack/react-form` — form state
- `zod` — runtime schema validation, paired with types derived from `openapi.json`
- `lucide-react` — icon set (shadcn default, keep consistent)
- ESLint + Prettier, strict configs
- Vitest for unit tests (Vite-native)

No SSR framework (Next.js, Remix, React Router SSR mode) — explicitly excluded by design decision.

---

## 6. Repository Layout

**Repository name:** `HOSTMAN-FRONTEND`

```
HOSTMAN-FRONTEND/
├── package.json
├── bun.lockb
├── vite.config.ts
├── tsconfig.json
├── README.md
├── .env.example
├── .gitignore
├── components.json          (shadcn config from init)
├── .github/
│   └── workflows/
│       └── ci.yml
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── config.ts
│   ├── routes/              (React Router route definitions/pages)
│   │   ├── login.tsx
│   │   ├── dashboard.tsx
│   │   ├── services.tsx
│   │   └── load-test.tsx
│   ├── layouts/
│   │   ├── AppLayout.tsx    (sidebar + topbar shell)
│   │   ├── Sidebar.tsx
│   │   └── Topbar.tsx
│   ├── api/
│   │   ├── client.ts
│   │   ├── health.ts
│   │   ├── services.ts
│   │   ├── loadTest.ts
│   │   ├── schemas.ts       (Zod schemas)
│   │   └── types.ts
│   ├── components/
│   │   └── ui/              (shadcn-generated components live here)
│   ├── store/                (in-memory token/auth state)
│   ├── styles/
│   │   └── globals.css       (shadcn theme tokens + accent extensions)
│   └── workers/
├── docs/
│   ├── phases/
│   ├── backend-api/          (copied: openapi.json, README.md, frontend-guide.md)
│   ├── user-manual.md
│   ├── setup-guide.md
│   ├── deployment-guide.md
│   └── versions.md
├── scripts/
│   ├── bootstrap.sh
│   ├── bootstrap.ps1
│   ├── run.sh
│   └── run.ps1
└── public/
```

Presentational components take props only, no fetching. Route/page components own data fetching via TanStack Query hooks. Store holds token (in-memory) + shared app state only — never persisted.

---

## 7. Design System — Modern Dark SaaS Dashboard

**Reference standard (must match this quality/style, not generic AI dashboard look):**
- https://dribbble.com/shots/24228102-Dashboard-Dark
- https://dribbble.com/shots/26620360-Hynex-Healthcare-Dashboard-Design

**Layout:** real dashboard shell — **vertical sidebar** (nav: Dashboard, Services, Load Test, Connections [§12 Phase 8]) + **horizontal topbar** (status pill, admin session, logout). Not a single flat scrolling page.

**Visual style — NOT flat/bordered, NOT literal "claymorphism":**

- Background: near-black/deep navy base with **layered surfaces** — cards sit one shade lighter than the page; avoid hard 1px borders as the primary separator, use elevation/contrast instead.
- Depth via **soft, large, low-opacity blurred glow shadows** (colored glow matching the accent) — not flat outlines, not heavy hard-edged shadows.
- Vibrant accent colors (purple/blue/teal/pink) used sparingly and intentionally — primary actions, active nav item, key stat numbers, chart lines. Rest stays muted/neutral so accents pop.
- Large, bold typography for key numbers/stats; smaller muted labels.
- Generous whitespace/padding.
- Rounded corners: moderate scale, **half of default shadcn radius** (radius token = 0.3125rem, not the shadcn default 0.625rem), consistent everywhere.
- Buttons/badges: filled gradient/solid vibrant for primary/semantic states, ghost/subtle for secondary.
- Semantic colors (enabled=green/success, disabled=gray, pending=amber/warning, error=red) as soft glowing pill badges with tinted translucent background + colored text — not outlined boxes.

**Base token palette (locked, owner-provided via shadcn preset `b1D0dv72`).** Use the initialized theme's OKLCH tokens as the structural base (background/foreground/card/border/muted/sidebar). Extend with dedicated accent tokens layered on top — do not rely on neutral `--primary`/`--chart-*` alone for CTAs/stats/badges:

```css
.dark {
  --accent-glow-primary: oklch(0.65 0.25 280);   /* purple */
  --accent-glow-secondary: oklch(0.7 0.2 230);   /* blue */
  --accent-glow-tertiary: oklch(0.75 0.15 190);  /* teal */
  --success: oklch(0.75 0.18 145);
  --warning: oklch(0.8 0.15 85);
}
```

**Rejection criteria for agents:** if a card looks like a plain bordered `<div>` with a 1px outline and no glow/depth, or the layout is a single flat page without sidebar+topbar, it does not meet this spec — redo it.

---

## 8. shadcn Component Workflow

- Init once at Phase 1 with the exact command in §5. Never re-run `init` after (only `add` for new components).
- Add components as needed: `bunx --bun shadcn@latest add <component>`.
- Do not hand-roll a component shadcn already provides (button, card, badge, input, dialog, dropdown, sidebar, etc.) — add it via CLI, then restyle per §7 tokens.
- Keep `components/ui/` as shadcn-generated/CLI-managed; app-specific composed components go in `components/` (not `components/ui/`).

---

## 9. API Integration Rules

- All API calls go through `src/api/client.ts` (one fetch wrapper) + TanStack Query hooks — no ad-hoc `fetch()` in components.
- Types in `src/api/types.ts` derived from `docs/backend-api/openapi.json`; runtime-validated with Zod schemas in `src/api/schemas.ts` before use.
- Admin token: in-memory store only; sent as `X-Admin-Token` header; cleared on logout/tab close (never written to storage).
- Errors normalized to `{status, code, message}` per backend's error code list in `docs/backend-api/README.md`; global error boundary + inline per-component errors.
- Retry policy via TanStack Query: transient errors (network/408/429/503) capped backoff up to 3 tries; 4xx not retried.
- Load-test report: TanStack Query polling (~1s interval), stop on `completed`/`cancelled`/`404`.

---

## 10. Security Requirements

- CSP header set at build/deploy config (via reverse proxy or `<meta>` fallback) — no `unsafe-inline`, no `unsafe-eval`.
- No sourcemaps shipped in production build.
- `bun audit` (or equivalent) run in CI; fail build on high/critical vulnerabilities.
- No API keys, tokens, or backend internals in client bundle — verify by grepping build output before each release.
- React's default escaping used everywhere; no raw `dangerouslySetInnerHTML` with API-sourced data.
- Zod-validate all enum-like values (`state`, `mode`) before rendering.
- CSRF: out of scope for MVP (bearer header, not cookies) — revisit only if auth model changes to cookies later.
- No third-party analytics/tracking scripts.

---

## 11. Performance Requirements

- React Compiler enabled — no manual `useMemo`/`useCallback` unless compiler can't cover it (document why).
- Route-based code splitting via React Router lazy loading.
- Polling-driven UI throttled to ≤1Hz via TanStack Query; true 120 FPS reserved for future realtime features only (not built yet).
- Bundle size budget tracked per phase; flag any single dependency >50KB gzipped before adding.

---

## 12. 10-Phase Execution Plan

Agents must complete exactly these 10 phases. No phase skipping. Each phase produces `docs/phases/phase-XX.md` with: what was built, how to test, expected result, known limitations, commands used, approval checklist, and a mandatory **Owner Test Card** (§16).

### Phase 1 — Repo Bootstrap & shadcn Init
Vite+React+TS(v7)+Bun scaffold, React Compiler enabled, shadcn init with owner's exact preset command (§5), folder structure (§6), `.env.example`, CI skeleton, `docs/versions.md`.
**Exit:** `bun run dev` starts a blank themed app with no errors; shadcn theme visibly applied.

### Phase 2 — Dashboard Shell (Sidebar + Topbar)
`AppLayout`, `Sidebar`, `Topbar` per §7 layout spec, React Router routes wired (empty pages), nav items for Dashboard/Services/Load Test + Connections placeholder.
**Exit:** Navigating between routes shows correct sidebar highlight + page content swap, matches §7 visual spec (glow/depth, accent tokens, half-radius).

### Phase 3 — API Client Layer
`api/client.ts`, `api/types.ts`, `api/schemas.ts` (Zod), TanStack Query setup, error normalization, retry logic, in-memory token store.
**Exit:** Client successfully calls `/healthz` and `/readyz` against a running backend.

### Phase 4 — Auth / Login Flow
Login route (token input via TanStack Form), verify against `/api/v1/system/health`, in-memory session, logout, `admin_disabled`/`401` handling.
**Exit:** Wrong token shows error; correct token reaches dashboard; token never persisted (verify in devtools storage tab).

### Phase 5 — Dashboard Core
Status pill, core version, uptime, server time, CPU/Memory/Disk cards, process memory, OS info, git commit — styled per §7.
**Exit:** Dashboard shows live data matching `/api/v1/system/health` + `/api/v1/system/info`.

### Phase 6 — Service Control UI
Service list with state badges (`enabled`/`disabled`/`pending`/`error`), Start/Stop/Pending/Enable/Disable buttons, in-flight states, TanStack Query refetch-after-action.
**Exit:** Toggling a service via UI updates its state correctly and matches backend response.

### Phase 7 — Load Test UI
Load test form (TanStack Form + Zod validation, bounded inputs matching backend limits), submit → poll report via TanStack Query → render metrics + gauge + verdict.
**Exit:** Running a load test from the UI shows a completed report matching the raw API response.

### Phase 8 — Connections & Multi-Device Control (UI only, no live media yet)
Replaces the generic "Coming Soon" nav items with a real **Connections** section.

**Design (owner-specified, screenshot-confirmed):**
- Sidebar: single **"Connections"** nav item (replaces separate Camera/Mic/Location/Screen/Full Control items).
- Connections page: list of devices, each marked **online** or **offline**.
- Clicking an **online** device opens a dedicated **phone-shaped window** (portrait aspect ratio, like a phone screen) showing that device's preview, with control buttons on the right side of the window.
- **One connection = one window = one device.** Not shared/switching — each opened device gets its own persistent window.
- User chooses how many devices to open at once (1, 2, or more) — all open windows are visible simultaneously on screen, user's choice entirely.
- **"Total Control"** — a separate master toggle (TeamViewer-style): when ON, takes over mouse/touch input control across all currently-open windows at once. When turned OFF, control reverts back to each window's own individual controls (state before Total Control was enabled).
- This phase is **UI/interaction scaffolding only** — no real WebRTC/media stream yet (that's the future realtime work, §19 out of scope). Use mock/placeholder device data and static preview boxes; wire real streams later.

**Exit:** Connections page lists mock online/offline devices; clicking online ones opens independent phone-shaped windows with control button placeholders; opening multiple devices shows multiple windows at once; Total Control toggle visibly switches all open windows into a unified control state and reverts correctly on toggle-off.

### Phase 9 — Security Hardening
CSP finalized, sourcemap stripped from prod build, `bun audit` clean, bundle grep for leaked secrets, dependency review.
**Exit:** Production build passes all security checks in §10; documented in phase report.

### Phase 10 — Docs, Deployment & Final Polish
`docs/user-manual.md`, `docs/setup-guide.md`, `docs/deployment-guide.md` (Windows RDP + Linux), bootstrap scripts, final UI polish pass, Git tag/release.
**Exit:** All Definition of Done items (§14) checked.

---

## 13. Git Workflow

Work only current phase → phase doc → checks pass → short report → owner approval → commit/push → next phase only on "yes."

Commit style:
```
phase-01: repo bootstrap and shadcn init
phase-02: dashboard shell (sidebar + topbar)
...
```

---

## 14. Definition of Done

1. `bun run dev` runs locally with zero config beyond `.env`.
2. `bun run build` produces a production bundle with no errors/warnings.
3. Sidebar + topbar dashboard shell with working React Router navigation.
4. Login flow works; token never persisted.
5. Dashboard shows live health/system data.
6. Service start/stop/pending/enable/disable works from UI.
7. Load test can be run and report displayed from UI.
8. Connections page works: online/offline device list, per-device phone-shaped windows (multi-window, user's choice), Total Control master toggle.
9. CSP + security checklist (§10) fully passed.
10. No secrets/tokens in build output (verified by grep).
11. `docs/user-manual.md`, `docs/setup-guide.md`, `docs/deployment-guide.md` exist and are accurate.
12. Bootstrap scripts work on fresh Windows/Linux RDP.
13. All 10 phase docs + Owner Test Cards exist.
14. Owner approved every phase.
15. Design matches §7 spec — modern dark SaaS dashboard, sidebar+topbar, no default/templated/flat-bordered look.

---

## 15. Local Run / Deployment Targets

- Local dev: `bun install` → `bun run dev`
- Production build: `bun run build` → `bun run preview` (or serve `dist/` via reverse proxy)
- Windows RDP: bootstrap script installs Bun if missing, clones repo, builds, serves.
- Linux RDP/server: same via `.sh` script; optional Nginx/Caddy reverse proxy for HTTPS + CSP headers.
- No Docker requirement for MVP.

---

## 16. Owner Test Card Requirement

Every phase doc must include, per testable claim:

```
Command to run: <exact copy-paste command>
Expected output: <exact result owner should see in browser/terminal>
If it fails, you'll see: <what failure looks like>
```

No phase is approved without this.

---

## 17. Agent Behavior Rules

- Work phase by phase, one at a time.
- State current phase before working.
- Read `docs/backend-api/*` before touching API integration — do not guess endpoints/shapes.
- Do not invent endpoints not in `openapi.json`.
- Ask only one concise question if blocked.
- Keep answers short; show exact commands/paths.
- Not move to next phase without owner approval.
- Not add SSR, SEO, analytics, or cookie-based auth without explicit owner sign-off.
- Do not hand-roll components shadcn already provides — use the CLI (§8).

---

## 18. Recommended MCP / Tooling for Agents

Connect before Phase 1:

- **GitHub MCP** — push/PR/CI status for the `HOSTMAN-FRONTEND` repo.
- **Context7 (docs MCP)** — pulls current React, Vite, React Router, TanStack Query/Form, Zod, and shadcn docs so the model doesn't hallucinate outdated APIs.
- **shadcn-ui MCP** (`@jpisnice/shadcn-ui-mcp-server`) — pulls real shadcn component structure/props/variants directly, so agents add/extend real components instead of hand-rolling approximations.
- Reuse the same `STATE.md`-first-read convention to avoid burning tokens re-scanning the repo on every model switch.

```json
{
  "mcpServers": {
    "github-local": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": { "GITHUB_PERSONAL_ACCESS_TOKEN": "" }
    },
    "context7": {
      "command": "npx",
      "args": ["-y", "@upstash/context7-mcp@latest"]
    },
    "shadcn-ui": {
      "command": "npx",
      "args": ["-y", "@jpisnice/shadcn-ui-mcp-server", "--github-api-key", "your-github-token"]
    }
  }
}
```

---

## 19. Explicitly Out of Scope (for now)

- SSR / SEO / meta tags / sitemaps.
- Real-time WebRTC/WebSocket media (reserved, not built — placeholders only, §12 Phase 8).
- Multi-user/reseller roles (backend doesn't have them active yet either).
- Payment UI (matches backend: no payment system).
- Docker (optional later, not required for MVP).