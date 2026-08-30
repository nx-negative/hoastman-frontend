# HOSTMAN-FRONTEND

Admin control panel frontend for HOSTMAN. Client-side SPA — React 19 + Vite 8 + TypeScript 7 + Bun, shadcn/ui (Base UI), Tailwind CSS v4, React Compiler enabled.

## Requirements

- [Bun](https://bun.sh) 1.4+

## Run

```sh
bun install
cp .env.example .env   # set VITE_API_BASE_URL
bun run dev
```

## Scripts

| Command | Purpose |
| --- | --- |
| `bun run dev` | Dev server |
| `bun run build` | Typecheck + production build |
| `bun run preview` | Preview production build |
| `bun run lint` | ESLint |
| `bun run typecheck` | `tsc --noEmit` |
| `bun run test` | Vitest |
| `bun run format` | Prettier |

Docs: `project.md` (spec), `docs/phases/` (phase reports), `docs/backend-api/` (API contract).
