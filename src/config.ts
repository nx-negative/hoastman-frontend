// API base URL (§4): deployment-provided via VITE_API_BASE_URL; fallback is the
// backend's documented default (docs/backend-api/README.md). Trailing slashes
// are stripped so endpoint paths can be appended with a leading "/".
const raw = import.meta.env.VITE_API_BASE_URL

export const API_BASE = (
  typeof raw === "string" && raw.trim() ? raw.trim() : "http://127.0.0.1:8080"
).replace(/\/+$/, "")
