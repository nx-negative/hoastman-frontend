# Phase 7 — Load Test UI

## What was built
- `routes/load-test.tsx` — form (TanStack Form + Zod `onChange`), mode Select (CLI component), start → poll → report flow, cancel, "Run another"
- `routes/load-test.helpers.ts` — bounded schema (duration 1–300 s, sessions 1–256, fps 1–240, payload 1–1024 KB — exact backend contract), workload-budget pre-check (`sessions × fps × payload ≤ 262 144` → 400 server-side; pre-checked inline), verdict styling, normalized action errors, `firstError` issue extractor
- `components/gauge.tsx` — radial gauge for peak CPU (shadcn ships no gauge; §8-allowed, documented)
- `api/loadTest.ts` — shared report query key; report polling ~1 s, stops on `completed`/`cancelled`/404 (§9 — the one owner-approved polling feature; §11 ≤1 Hz respected)
- shadcn CLI adds: `select` (Base UI — `onValueChange`, not Radix props)
- Tests: schema bounds/budget, verdict maps, error mapping, `firstError` (64 total)

## Fixes found at gate
- TanStack Form aggregates issues as nested arrays → `firstError`/formErrors flatten + narrow (no casts)
- Base UI Select emits `null` on clear → guarded (kept previous value)
- `firstError` moved to helpers (react-refresh: routes export components only)

## Fetch policy note
Manual-fetch policy (owner) applies to start/cancel; report polling is the Phase 7 §12 exception, explicitly scoped: only while a run is in flight.

## Commands used
`bunx --bun shadcn@latest add select` · `bun run format/typecheck/test/lint/build`

## Known limitations
- Report renders only the fields in `openapi.json` `LoadReportDto`; no charts beyond the single gauge (backend exports no time series).
- Only one test at a time (backend 409); UI surfaces the normalized message.

## Approval checklist
- [x] Zero build/type/lint errors
- [x] 64/64 tests pass
- [x] dist leak-grep clean
- [ ] Owner approval

## Owner Test Card
1. Command: `bun run dev` → open `http://localhost:5173/load-test`
   Expected: form with Duration / Sessions / FPS / Payload / Mode, "Start Test" button.
   Fails if: blank page or missing fields → check console.
2. Command: set Duration to `0` → blur
   Expected: red inline "Duration must be between 1 and 300"; Start blocked.
   Fails if: request fires anyway.
3. Command: Sessions `256`, FPS `240`, Payload `1024` → Start
   Expected: inline "Workload budget exceeded: … must be ≤ 262144" — no request sent.
   Fails if: backend 400 alert appears instead (pre-check broken).
4. Command: Duration `5`, Sessions `4`, FPS `30`, Payload `64` → Start Test
   Expected: button → "Testing…" spinner; when backend completes (~5 s) report card renders: gauge (peak CPU %), requests/s, p50/p95/p99, frames/events, verdict badge, recommendations; Network shows ~1 req/s `/api/v1/system/test/report` polling that STOPS when done.
   Fails if: report never appears → check backend `…/system/test/report` with curl.
5. Command: start a 60 s run, click "Cancel Test"
   Expected: ack → polling stops; report shows `cancelled`.
   Fails if: polling continues >2 s after cancel.
6. Command: stop backend → Start Test
   Expected: alert "Cannot reach the server. Check that the API is running." — no host/IP in UI or console.
   Fails if: raw error/URL shown.
7. Command: `bun run test`
   Expected: `Tests  64 passed (64)`.
   Fails if: any red FAIL block.

## Owner overrides (2026-09-01, post-review)

- **Silent no-op fixed:** the old frontend budget pre-check (sessions×fps×payload ≤ 262144) blocked submit with no message. Removed — the backend is now the sole authority; a rejected start ALWAYS shows a red "Request failed" alert with the normalized reason (submit-path try/catch added so a failed parse can never be silent).
- **Payload max raised to 1 GB** (`PAYLOAD_MAX = 1_048_576 KB`, owner directive). If the backend still rejects >1024 KB, the rejection message is displayed instead of being swallowed.
- **Number steppers removed** from all four inputs (plain number fields).

### Revised Test Card cases

```
Command to run: UI — /load-test, set Payload 1024, Sessions 3, Start Test
Expected output: submit goes through; backend accepts OR a visible red
  "Request failed" alert appears with the reason — never a silent click
If it fails, you'll see: click with no reaction or no message

Command to run: UI — Payload 1048576 (1 GB) accepted in the field
Expected output: no bounds error; submit fires; backend verdict or visible error
If it fails, you'll see: inline "Payload size must be between 1 and 1048576"
```
