# Verified latest stable at Phase 1 bootstrap (2026-08-30). Bun 1.4.0 / Node 26.7.0.

| Package | Version |
| --- | --- |
| bun (runtime/package manager) | 1.4.0 |
| react / react-dom | 19.2.x (19.2.8 latest) |
| vite | 8.2.x (^8) |
| @vitejs/plugin-react | 6.1.x (^6) |
| typescript | 7.0.2 as `@typescript/native` (native `tsc`, §5: TS v7 strict) + `typescript` alias → `@typescript/typescript6@6.0.2` (JS API required by typescript-eslint; official side-by-side recipe from the TS 7.0 announcement) |
| react-router | 8.3.x (^8) |
| @tanstack/react-query | 5.102.x (^5) |
| @tanstack/react-form | 1.33.x (^1) |
| zod | 4.5.x (^4) |
| shadcn (CLI) | 4.19.0 — init preset `b1D0dv72`, template `vite`, `--pointer` |
| tailwindcss | 4.3.x (^4, via shadcn init) |
| @base-ui/react | 1.7.x (shadcn `base-mira` base) |
| lucide-react | 1.37.x |
| tw-animate-css | 1.4.x |
| babel-plugin-react-compiler | 1.0.0 (+ @rolldown/plugin-babel 0.2.x) |
| eslint | 10.9.x (^10) |
| eslint-plugin-react-hooks | 7.1.x |
| typescript-eslint | 8.x |
| prettier | 3.8.x (+ prettier-plugin-tailwindcss 0.8.x) |
| vitest | 4.1.x |

Notes:
- React Compiler wired in `vite.config.ts` via `reactCompilerPreset()` (per react.dev, @vitejs/plugin-react ≥ 6); verified in dev (`_c(` in transformed output).
- TS dual-install: `tsc` resolves to native TS 7 (`@typescript/native` alias); the `typescript` name resolves to the TS 6 API package so typescript-eslint works. Revisit when typescript-eslint supports the TS ≥7.1 API (typescript-eslint#10940).
- shadcn components live in `src/components/ui/` (CLI-managed); CSS at `src/styles/globals.css` (§6).
