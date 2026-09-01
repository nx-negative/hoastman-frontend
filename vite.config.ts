import path from "path"
import tailwindcss from "@tailwindcss/vite"
import react, { reactCompilerPreset } from "@vitejs/plugin-react"
import babel from "@rolldown/plugin-babel"
import { defineConfig, loadEnv, type Plugin } from "vite"

// §10: strict CSP via <meta> fallback, injected ONLY into production builds
// (dev is exempt — Vite HMR needs inline scripts). Deployment sets the real
// header via reverse proxy (§15/Phase 10); meta cannot carry frame-ancestors,
// so that directive belongs to the proxy config. React/Base UI style via
// CSSOM (no style attributes, no runtime <style> injection — verified in
// node_modules), so no 'unsafe-inline'/'unsafe-eval' is ever required.
function cspMetaPlugin(): Plugin {
  return {
    name: "hostman:csp-meta",
    apply: "build",
    transformIndexHtml(html) {
      const csp = [
        "default-src 'self'",
        "script-src 'self'",
        "style-src 'self'",
        "img-src 'self' data:",
        "font-src 'self'",
        "connect-src 'self'",
        "object-src 'none'",
        "base-uri 'none'",
        "form-action 'none'",
      ].join("; ")
      return html.replace(
        /<head>/,
        `<head>\n    <meta http-equiv="Content-Security-Policy" content="${csp}" />`
      )
    },
  }
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // §4/§15: dev API traffic is proxied to the backend — browser requests stay
  // same-origin (no CORS preflights, which the backend rejects). The target is
  // read server-side only via loadEnv; API_PROXY_TARGET is deliberately NOT
  // VITE_-prefixed so Vite can never expose it to client code (§10).
  // VITE_API_BASE_URL is honored as a fallback for spec (§4) compatibility.
  const env = loadEnv(mode, process.cwd(), "")
  const apiTarget =
    env.API_PROXY_TARGET?.trim().replace(/\/+$/, "") ||
    env.VITE_API_BASE_URL?.trim().replace(/\/+$/, "") ||
    "http://127.0.0.1:8080"

  return {
    plugins: [
      react(),
      tailwindcss(),
      cspMetaPlugin(),
      // React Compiler (§5): auto-memoization. Keep last so it runs on final JSX.
      babel({
        presets: [reactCompilerPreset()],
      }),
    ],
    resolve: {
      alias: {
        "@": path.resolve(import.meta.dirname, "./src"),
      },
    },
    server: {
      proxy: {
        "/api": { target: apiTarget, changeOrigin: true },
        "/healthz": { target: apiTarget, changeOrigin: true },
        "/readyz": { target: apiTarget, changeOrigin: true },
      },
    },
    build: {
      // §11: split vendor deps into cacheable chunks — keeps every chunk under
      // the 500 kB warning limit and isolates rarely-changing framework code.
      // Rolldown-native API: `manualChunks` is silently ignored by rolldown-vite;
      // `advancedChunks` is deprecated in favor of `codeSplitting` (same shape).
      rolldownOptions: {
        output: {
          codeSplitting: {
            groups: [
              {
                name: "framework",
                test: /node_modules[\\/](react|react-dom|scheduler)[\\/]/,
              },
              { name: "zod", test: /node_modules[\\/]zod[\\/]/ },
              { name: "vendor", test: /node_modules[\\/]/ },
            ],
          },
        },
      },
    },
  }
})
