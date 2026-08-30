# HOSTMAN-BACKEND Frontend Guide

For the next frontend agent. Stack: **Vite + SolidJS + TypeScript + Bun**. Design direction: **Claymorphism**. Build against THIS guide + `docs/api/README.md` + `docs/api/openapi.json` — no guessing.

## 1. How the frontend connects

The backend is a plain HTTP JSON API (no WebSockets yet — see §15). Base URL default `http://127.0.0.1:8080`. Public routes work without auth; admin routes need `X-Admin-Token` (§3).

## 2. API base URL configuration

Via Vite env var `VITE_API_BASE_URL`:

```ts
// src/config.ts
export const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "http://127.0.0.1:8080";
```

Never hardcode the URL in components. Use one tiny fetch wrapper:

```ts
// src/api/client.ts
async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "content-type": "application/json", ...adminHeaders() },
    ...init,
  });
  if (!res.ok) throw new ApiError(res.status, (await res.json()).error);
  return res.json();
}
```

## 3. Admin token handling

- Stored **in memory only** (module-level variable) after login; never in localStorage/sessionStorage/cookies for MVP (spec §12; §21a later replaces with keys).
- Login screen asks for the token; verify once against `GET /api/v1/system/health` (401 = wrong); keep for the session.
- Send as `X-Admin-Token: <token>` on every admin call (or `Authorization: Bearer <token>`).

## 4. Secure storage rules

- No tokens/secrets in localStorage/sessionStorage/indexedDB for MVP.
- `.env` committed to git = no secrets; commit `.env.example` with placeholders only, gitignore `.env`.
- The real admin secret lives only on the server env (`HOSTMAN_ADMIN_TOKEN`).

## 5. No secrets in frontend code

- Zero credentials in source; token is runtime-input only (in-memory).
- No API keys/URLs with embedded secrets. Optional gitleaks in CI.

## 6. Calling health APIs

- Public: `GET /healthz`, `GET /readyz` (no token) → green/red pill.
- Admin: `GET /api/v1/system/health` → `core_version`, `uptime_seconds`, `server_time_unix_ms`, `services[]`, optional `metrics` (OS, CPU count/usage, mem total/used/available, disk total/used/available, process memory, system uptime).
- Admin: `GET /api/v1/system/info` → hardware summary (`cpu_count`, `cpu_model`, `memory_total_bytes`, `disk_total_bytes`, `os`, `arch`, `git_commit`).

## 7. Calling the load test API

```ts
await api("/api/v1/system/test/load", {
  method: "POST",
  body: JSON.stringify({ duration_seconds: 5, concurrent_sessions: 4, fps: 120,
                         payload_size_kb: 64, mode: "full_control" }),
}); // → { accepted, message }; test runs in the background server-side
```

Poll `GET /api/v1/system/test/report` every ~1 s until `completed`/`cancelled`. Cancel: `POST /api/v1/system/test/load {"cancel":true}`.

## 8. Displaying server health

Claymorphism dashboard cards:

- Status pill, core version, uptime, server time.
- CPU card: count + usage % (radial/progress).
- Memory card: used/available/total bar.
- Disk card: used/available/total bar.
- Process memory, OS info, git commit if present.
- "Test req/s" gauge after a load-test run.

## 9. Displaying service status

`GET /api/v1/services` → rows `id, name, version, state, bound`. State badges:

| state | color | meaning |
|---|---|---|
| `enabled` | green | running |
| `disabled` | red/gray | stopped (admin-chosen) |
| `pending` | amber | parked, not publicly usable |
| `error` | dark red | failed last operation |

Never expose host IPs/internals to non-admin views (spec §12).

## 10. Start/stop/pending from admin UI

Buttons per service row (admin token required): **Start** `POST /services/{id}/start` (disabled/pending → 409 "enable first"; show message), **Stop** `POST /services/{id}/stop`, **Pending** `POST /services/{id}/pending`, **Enable** `POST /services/{id}/enable`, **Disable** `POST /services/{id}/disable`. After each: refetch the service list and update the row; disable buttons while in flight.

## 11. Future buttons (reserve now)

**Camera**, **Mic**, **Location**, **Screen View**, **Full Control** (Full Control = Screen View + Screen Control, spec §24). Each shows three states: permission (not granted/granted), connection (offline/connecting/live), error (with retry). Ship them disabled with "coming soon" tooltips until realtime lands (§15).

## 12. Smooth 120 FPS UI target

- Never block the main thread; re-render only what changed (SolidJS fine-grained signals).
- Polling-driven monitors throttle to ≤ 1 Hz; only true realtime (later) runs 120 FPS.
- `requestAnimationFrame` for animations; transform/opacity only; avoid layout thrash.

## 13. No blocking main thread

- No long synchronous loops in components; chunk heavy work; parse JSON lazily and minimally.

## 14. Web Workers where needed

- CPU-heavy work (metrics rendering, later stream encoding) in `new Worker(...)`; post messages; terminate on unmount.

## 15. Realtime later: WebRTC / WebSocket

- Media (screen/camera/mic) arrives via **WebRTC** (and/or WebTransport/QUIC); backend transport is abstracted for this (spec §25).
- Control-plane status can move from polling to **WebSocket** later.
- Keep the API client layered so a transport swap doesn't touch UI.

## 16. Security checklist

- Admin routes require the token; 401 on missing/wrong; token in memory only; cleared on logout.
- `503 admin_disabled` → show "start server with HOSTMAN_ADMIN_TOKEN" instructions.
- No server IP/health internals to non-admin roles; HTTPS in production via reverse proxy.

## 17. Vulnerability prevention checklist

- Updated deps; `bun audit` in CI; CSP header via proxy; no sourcemaps in release; no `eval`/`new Function`; `$html` only with trusted sanitized content.

## 18. XSS prevention

- SolidJS escapes text by default — always render API data as text, not innerHTML.
- Sanitize any rich content; never interpolate response strings into `innerHTML`.
- Validate `state`/`mode` strings against known enum lists before rendering.

## 19. CSRF protection (if needed)

- MVP uses a bearer header (not cookies) → mostly out of scope. If cookies later: SameSite=Strict + custom header check + verify Origin.

## 20. Input validation

- Client-side: constrain load-test inputs to bounds (duration 1–300, sessions 1–256, fps 1–240, payload 1–1024 KB, mode enum) before send; inline errors.
- Server re-validates + enforces budget (sessions×fps×payload ≤ 262144) → 400; surface `{error:{message}}`.

## 21. Error handling

- `ApiError` wrapper with `status`+`code`+`message` (error format in `docs/api/README.md`).
- One global error banner + inline per-component errors. Map codes: `unauthorized`→wrong token, `admin_disabled`→token not set, `conflict`→per-context, `rate_limited`→slow down, `timeout`→timed out.

## 22. Loading states

- Every async action sets a loading flag; disable the trigger button; spinner with action name. Refetches show skeletons.

## 23. Empty states

- No services / no metrics wired / no report yet (404): friendly card with next action (e.g. "Run the first load test"). Never blank or raw error.

## 24. Retry logic

- Transient (network, 408, 429, 503 overloaded): capped backoff, up to 3 tries (500ms→2s).
- 4xx (400/401/404/409) NOT retried — show message.
- Report polling already retries each second until finished.

## 25. Clean component architecture

```
src/
  api/        client.ts, health.ts, services.ts, loadTest.ts, types.ts
  components/ StatusPill, HealthCards, CpuCard, MemCard, DiskCard, ServiceRow,
              ServiceList, LoadTestForm, ReportView, MetricGauge,
              PermissionButton (camera/mic/location/screen/fullControl placeholders)
  pages/      Dashboard.tsx, Admin.tsx, Login.tsx
  store/      signals/context (token, health refresh)
  styles/     claymorphism tokens (colors, soft shadows, radii)
  workers/    for future heavy tasks
```

Presentational components receive props and call no APIs; containers own fetching. SolidJS signals; `createResource`/`onCleanup` for polling.

## Design: Claymorphism

- Soft large-radius surfaces; dual subtle shadows (light top-left / dark bottom-right); slight 3D "squish" on press; pastel palette with clear semantic colors (§9); readable contrast.