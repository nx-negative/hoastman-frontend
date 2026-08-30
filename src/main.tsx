import { StrictMode } from "react"
import { createRoot } from "react-dom/client"

import "./styles/globals.css"
import App from "./App.tsx"
import { ThemeProvider } from "@/components/theme-provider.tsx"

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    {/* HOSTMAN is a dark-first admin dashboard (§7). */}
    <ThemeProvider defaultTheme="dark">
      <App />
    </ThemeProvider>
  </StrictMode>
)
