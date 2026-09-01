# Phase 9 — Security Hardening

## What was built
- **Strict CSP** (`§10`): production builds inject `<meta http-equiv="Content-Security-Policy">` — `default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; font-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'none'; form-action 'none'`. No `unsafe-inline`, no `unsafe-eval`. Build-only (`apply: "build"`) so Vite dev/HMR keeps working. Feasible because React/Base UI style exclusively via CSSOM — verified **0** `setAttribute("style"` occurrences in `@base-ui/react/esm`.
- **CI security gate** (`.github/workflows/ci.yml` new "Security checks" step): bundle leak grep (hosts/proxy env/`VITE_*`/storage key/PEM blocks), zero-sourcemap assertion, CSP-meta presence — all fail the build.
- **`frame-ancestors`/`report-uri`**: not expressible in meta — mandated for the reverse-proxy header config in Phase 10 deployment docs.

## §10 checklist
- [x] CSP set at build config (meta fallback; proxy headers in Phase 10) — no unsafe-inline/eval
- [x] No sourcemaps in prod build (`find dist -name '*.map'` → 0)
- [x] `bun audit --audit-level=high` clean (531 pkgs) + CI step fails on high/critical
- [x] Bundle grep clean: no hosts, `API_PROXY`, `VITE_*`, token, PEM. `admin_disabled` (×3) is an allowlisted **public error-code string** from the API contract, not a secret
- [x] No `dangerouslySetInnerHTML` / `eval` / `new Function` anywhere in `src/`
- [x] React default escaping; enum values (`state`, `mode`, verdicts) Zod-validated before render
- [x] No third-party analytics/tracking; no external URLs in `index.html`
- [x] No new dependencies added this phase (bundle unchanged)
- [x] CSRF out of scope (bearer header, no cookies) — unchanged

## Commands used
- `vite.config.ts` — added `cspMetaPlugin()` (inline, no deps)
- `bun audit --audit-level=high`; `find dist -name '*.map'`; `grep -rlE '<leak-pattern>' dist/assets`

## Known limitations
- Meta-CSP cannot enforce `frame-ancestors` (clickjacking) or report collection — reverse-proxy headers close this in Phase 10.
- Dev server runs without CSP (Vite HMR incompatibility) — production builds are the security boundary.

## Owner Test Card
1. **Command:** `bun run build && grep -c 'Content-Security-Policy' dist/index.html`
   **Expected:** build succeeds, prints `1`
   **If it fails:** prints `0` → CSP meta missing from build
2. **Command:** `find dist -name '*.map' | wc -l`
   **Expected:** `0`
   **If it fails:** any `.map` path listed → sourcemaps leaked
3. **Command:** `bun audit --audit-level=high`
   **Expected:** `No vulnerabilities found (checked 531 packages)`
   **If it fails:** CVE table + non-zero exit
4. **Command:** `grep -rlE '127\.0\.0\.1:8080|localhost:8080|API_PROXY|VITE_[A-Z_]+|hostman_admin_token' dist/assets`
   **Expected:** empty output
   **If it fails:** file paths printed → leaked string listed
5. **Command:** `bun run preview` → open `http://localhost:4173`, log in, open all menus/pages
   **Expected:** app fully functional; DevTools console shows **no** CSP violation errors
   **If it fails:** red `Refused to … violating Content Security Policy` entries → paste them