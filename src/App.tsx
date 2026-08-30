import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

/**
 * Phase 1 bootstrap proof — blank page rendering the preset theme tokens.
 * The real dashboard shell (sidebar + topbar) lands in Phase 2 (§12).
 */
export function App() {
  return (
    <div className="flex min-h-svh items-center justify-center bg-background p-6">
      <Card className="w-full max-w-sm border-none py-6 shadow-[0_0_120px_-24px_var(--accent-glow-primary)]">
        <CardHeader>
          <CardTitle className="text-3xl font-bold tracking-tight">
            HOSTMAN
          </CardTitle>
          <CardDescription>Admin control panel — bootstrap OK.</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center gap-2">
          <Badge className="bg-accent-glow-primary text-primary-foreground">
            phase-01
          </Badge>
          <Button>Primary action</Button>
        </CardContent>
      </Card>
    </div>
  )
}

export default App
