# Phase 1 — Repo Bootstrap & shadcn Init

Status: complete, all checks green — awaiting owner approval (§13).

## What was built

- Scaffolded via the exact §5 command: `bunx --bun shadcn@latest init --preset b1D0dv72 --template vite --pointer` (owner preset, Vite + Tailwind v4 + Base UI). Output moved to repo root per §6.
- React Compiler enabled: `@rolldown/plugin-babel` + `reactCompilerPreset()` as last plugin in `vite.config.ts`. Verified live (memo-cache `_c(` present in dev-transformed components).
- TS v7 strict: `@typescript/native` alias → `typescript@7.0.2` (native `tsc`, used by `typecheck`/`build`); `typescript` name → `@typescript/typescript6@6.0.2` (TS 6 JS API required by typescript-eslint — official side-by-side recipe from the TS 7.0 announcement).
- Folder structure per §6: `src/routes|layouts|api|store|workers|styles|components/ui|lib`, `docs/phases`, `scripts`, `.github/workflows`, `public`.
- shadcn components via CLI only: `button` (init), `card`, `badge` (`bunx --bun shadcn@latest add card badge`).
- §7 tokens layered on owner preset in `src/styles/globals.css`: `--radius: 0.3125rem` (half default), `--accent-glow-primary/secondary/tertiary`, `--success`, `--warning`, registered as Tailwind theme colors; app forced dark. Bootstrap proof card uses purple glow shadow (`shadow-[0_0_120px_-24px_var(--accent-glow-primary)]`), no hard border.
- Config: `.env.example` (`VITE_API_BASE_URL`), env rules in `.gitignore` (real `.env*` never committed), CI workflow (audit → lint → typecheck → test → build), `README.md`, `docs/versions.md`, Vitest unit test for `cn()`.
- §5 core deps pre-installed for later phases: `react-router@8`, `@tanstack/react-query@5`, `@tanstack/react-form@1`, `zod@4`.

## Checks (all green)

| Gate | Command | Result |
| --- | --- | --- |
| Typecheck (native TS 7) | `bun run typecheck` | exit 0, no output |
| Lint | `bun run lint` | exit 0, 0 errors / 0 warnings |
| Unit tests | `bun run test` | 3 passed (3) |
| Build | `bun run build` | `✓ built`, no warnings; 236.42 kB JS / **74.92 kB gzip** |
| Audit | `bun audit --audit-level=high` | no vulnerabilities (489 pkgs) |
| Dev | `bun run dev` | `VITE v8.2.2 ready in 414 ms`, zero errors; theme applied |

## Known limitations

- typescript-eslint still needs the TS 6 JS API (TS 7.0 ships none) → dual install documented in `docs/versions.md`; revisit at typescript-eslint#10940.
- `docs/backend-api/*` (openapi.json, README, frontend-guide) not yet copied by owner — hard prerequisite before Phase 3 (§9); do not guess endpoints.
- Single-entry bundle for now; route-level code splitting starts in Phase 2 (React Router lazy).
- ESLint: `react-refresh/only-export-components` disabled for `src/components/ui/**` only (shadcn files export `xVariants` helpers; files stay CLI-managed per §8).

## Commands used

```
bunx --bun shadcn@latest init --preset b1D0dv72 --template vite --pointer
bunx --bun shadcn@latest add card badge
bun install
bun run typecheck / lint / test / build / format
bun audit --audit-level=high
```

## Owner Test Card

1. Themed dev app (phase exit criterion)

```
Command to run: bun install && cp .env.example .env && bun run dev
Expected output: terminal → "VITE v8.2.2 ready" with zero red errors; browser at
  http://localhost:5173 → dark near-black page, centered card one shade lighter,
  soft purple glow behind it, "HOSTMAN" title, "phase-01" badge + one button,
  rounded corners (subtle, half-radius — not the round default).
If it fails, you'll see: terminal red Vite/TS overlay errors; or
  "Port 5173 is already in use" → rerun as: bun run dev -- --port 5174
```

2. All gates

```
Command to run: bun run typecheck && bun run lint && bun run test && bun run build
Expected output: typecheck/lint print nothing (exit 0); test prints
  "Test Files  1 passed (1) / Tests  3 passed (3)"; build prints the asset table
  ending in "✓ built in <1s>" with no warnings.
If it fails, you'll see: eslint "✖ N problems (N errors…)", tsc "error TS…",
  or a red Vite build error naming the file.
```

3. Dependency audit

```
Command to run: bun audit --audit-level=high
Expected output: "No vulnerabilities found (checked ~489 packages)".
If it fails, you'll see: "N vulnerabilities found" with a GHSA/severity table.
```

4. React Compiler active (optional probe)

```
Command to run: bun run dev &   then: curl -s http://localhost:5173/src/App.tsx | grep -c '_c('
Expected output: 1  (or higher — memo cache hooks injected by the compiler).
If it fails, you'll see: 0 → compiler not applied; check plugin order in vite.config.ts.
```

## Approval checklist

- [x] Exit criterion: `bun run dev` = blank themed app, zero errors, shadcn theme visibly applied
- [x] Zero build / type / lint errors; audit clean; tokens + half-radius + glow per §7
- [ ] Owner approval → commit `phase-01: repo bootstrap and shadcn init` (§13)
