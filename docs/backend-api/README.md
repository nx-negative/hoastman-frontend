# HOSTMAN-BACKEND API Documentation

Version 0.1.0 · OpenAPI 3.1.0 · Machine-readable spec: [`openapi.json`](openapi.json) (regenerate from a running server: `curl http://127.0.0.1:8080/api-docs/openapi.json`).

## Base URL and auth

- Base URL: `http://<host>:8080` (override with env `HOSTMAN_HTTP_ADDR`, default `127.0.0.1:8080`).
- Admin routes (all `/api/v1/system/*` and `/api/v1/services/*`) require the admin token.
- Set it on the server: `HOSTMAN_ADMIN_TOKEN=secret ./target/release/hostman-health`
- Send it on requests via header `X-Admin-Token: secret` OR `Authorization: Bearer secret`.
- If `HOSTMAN_ADMIN_TOKEN` is unset, admin routes return `503 {error:{code:"admin_disabled"}}` (secure by default).

## Error format

Every non-2xx response uses one shape:

```json
{"error":{"code":"<code>","message":"<human readable message>"}}
```

Codes: `not_found` (404) · `unauthorized` (401) · `admin_disabled` (503) · `conflict` (409) · `rate_limited` (429) · `invalid_request` (400) · `timeout` (408) · `internal_error` (500). Missing and wrong tokens return **identical** 401 bodies (no probing oracle).

## Rate limiting and limits

- Public routes (`/healthz`, `/readyz`, `/api-docs/openapi.json`): per-IP fixed-window limit (default 100 req / 10 s per IP). Excess → `429 rate_limited`.
- Request body limit: 64 KB. Excess → `413` (HTTP status, not the JSON body).
- Request timeout: 15 s. Excess → `408 timeout` JSON.

## Public endpoints

### `GET /healthz`
Liveness — no internal data (spec §12).

```sh
curl http://127.0.0.1:8080/healthz
```
→ `200 {"status":"ok"}`

### `GET /readyz`
Readiness — intentionally minimal, leaks nothing (spec §12).

```sh
curl http://127.0.0.1:8080/readyz
```
→ `200 {"status":"ok","ready":true}`

### `GET /api-docs/openapi.json`
This OpenAPI document.

## Admin endpoints (require token)

### `GET /api/v1/system/health`
Detailed server health: uptime, core version, service states, plus (when a metrics source is wired) OS, CPU count/usage, memory total/used/available, disk total/used/available, process memory, system uptime, collection time.

```sh
curl -H 'X-Admin-Token: secret' http://127.0.0.1:8080/api/v1/system/health
```
→ `200` with fields: `status`, `core_version`, `uptime_seconds`, `server_time_unix_ms`, `services[]` (`id`, `name`, `version`, `state`, `bound`), `metrics?` (see `openapi.json` `SystemMetricsDto`).

### `GET /api/v1/system/info`
Static system + hardware summary: `name`, `core_version`, `service_api_version`, `os`, `arch`, `family`, `cpu_count`, `git_commit?`, plus optional hardware summary (`os_version`, `cpu_model`, `memory_total_bytes`, `disk_total_bytes`, `system_uptime_seconds`).

### `GET /api/v1/services`
List services with `id`, `name`, `version`, `state` (`enabled`/`disabled`/`pending`/`error`), `bound`.

### `POST /api/v1/services/{id}/start`
Start a service. Rules: already-started → 409 conflict; `disabled`/`pending` → 409 `"enable first"` (spec §8); unknown id → 404. Returns the updated service JSON.

### `POST /api/v1/services/{id}/stop`
Stop + disable. Returns updated service JSON. Unknown id → 404.

### `POST /api/v1/services/{id}/pending`
Park service as `pending` (stopped, not publicly usable, spec §8). Returns updated service JSON.

### `POST /api/v1/services/{id}/enable`
Enable + start. Returns updated service JSON.

### `POST /api/v1/services/{id}/disable`
Stop + disable (same effect as stop). Returns updated service JSON.

### `POST /api/v1/system/test/load`
Start a **realistic bounded load test** (spec §11) or cancel the running one.

Request body (`LoadInput`):

```json
{"duration_seconds": 5, "concurrent_sessions": 4, "fps": 120,
 "payload_size_kb": 64, "mode": "full_control"}
```

`mode`: `screen_view` | `full_control` (default) | `camera` | `mic` | `mixed`.
Bounds (clamped): duration 1–300 s (default 5); sessions 1–256 (default 4); fps 1–240 (default 120); payload 1–1024 KB (default 64).
Workload budget: `sessions × fps × payload_kb ≤ 262144` else `400 invalid_request`.
Cancel: send `{"cancel": true}` → running test is cancelled safely (succeeds even mid-run).
One test at a time: a second start while running → `409 conflict`.

```sh
curl -X POST -H 'X-Admin-Token: secret' -H 'content-type: application/json' \
  -d '{"duration_seconds":5,"concurrent_sessions":4,"fps":120,"payload_size_kb":64}' \
  http://127.0.0.1:8080/api/v1/system/test/load
```
→ `200 {"accepted":true,"message":"load test started: 4 session(s) at 120 fps for 5s, mode full_control"}`

### `GET /api/v1/system/test/report`
Latest load test report (spec §11, full field list in `openapi.json` `LoadReport`):

```json
{"mode":"full_control","completed":true,"cancelled":false,
 "target_duration_secs":5,"actual_duration_secs":5.00,
 "target_fps":120,"actual_fps":119.99,"concurrent_sessions":4,"payload_size_kb":64,
 "total_requests":2400,"requests_per_second":479.95,
 "frames_processed":2400,"events_processed":2400,
 "failed_requests":0,"dropped_events":0,
 "p50_latency_ms":0.64,"p95_latency_ms":0.69,"p99_latency_ms":0.72,
 "cpu_usage_percent":42.68,"memory_used_mb":11.99,"max_concurrent_sessions":4,
 "estimated_stable_capacity":3,"verdict":"stable",
 "recommendations":["workload sustainable; increase sessions or fps gradually to find the ceiling"]}
```

Verdict: `stable` (≥95% FPS, <0.1% drops) · `degraded` (≥80% FPS, <5% drops) · `overloaded` (else, or any failed request). <404> until a run has completed.