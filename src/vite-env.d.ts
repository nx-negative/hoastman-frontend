/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Base URL of the HOSTMAN-BACKEND API (no trailing slash) — see .env.example. */
  readonly VITE_API_BASE_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
