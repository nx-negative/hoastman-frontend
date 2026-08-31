import path from "path"
import tailwindcss from "@tailwindcss/vite"
import react, { reactCompilerPreset } from "@vitejs/plugin-react"
import babel from "@rolldown/plugin-babel"
import { defineConfig } from "vite"

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
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
  build: {
    // §11: split vendor deps into cacheable chunks — keeps every chunk under
    // the 500 kB warning limit and isolates rarely-changing framework code.
    rolldownOptions: {
      output: {
        advancedChunks: {
          groups: [
            { name: "framework", test: /node_modules[\\/](react|react-dom|scheduler)[\\/]/ },
            { name: "zod", test: /node_modules[\\/]zod[\\/]/ },
            { name: "vendor", test: /node_modules[\\/]/ },
          ],
        },
      },
    },
  },
})
