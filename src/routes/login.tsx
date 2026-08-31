import { useState } from "react"
import { useForm } from "@tanstack/react-form"
import { Navigate, useLocation, useNavigate } from "react-router"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { getSystemHealth } from "@/api/health"
import { setAdminToken, useAdminToken } from "@/store/auth"
import { Server, ShieldAlert } from "lucide-react"

import {
  getLoginErrorMessage,
  loginSchema,
  type SubmitError,
} from "./login.helpers"

/** §12 Phase 4: token verification hits /api/v1/system/health (admin-gated). */
export default function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [submitError, setSubmitError] = useState<SubmitError | null>(null)

  // §4 fix: already-authenticated visitors never see the sign-in form. Reactive
  // (useAdminToken) so the redirect tracks the session live.
  const sessionToken = useAdminToken()

  const form = useForm({
    defaultValues: { token: "" },
    validators: { onChange: loginSchema },
    onSubmit: async ({ value }) => {
      setSubmitError(null)
      const { token } = loginSchema.parse(value)
      try {
        // §2.2 fix: verify BEFORE committing to the session store. The token
        // is passed explicitly (apiFetch override) so getAdminToken() stays
        // empty until the token is proven valid — this closes the bypass where
        // an unverified token reached the store and tripped the redirect guard
        // on the interim re-render (2nd-click-into-dashboard bug).
        await getSystemHealth(token)
        setAdminToken(token)
        const from =
          (location.state as { from?: string } | null)?.from ?? "/dashboard"
        navigate(from, { replace: true })
      } catch (error) {
        setSubmitError(getLoginErrorMessage(error))
      }
    },
  })

  if (sessionToken) {
    const from =
      (location.state as { from?: string } | null)?.from ?? "/dashboard"
    return <Navigate to={from} replace />
  }

  return (
    <div className="flex min-h-svh items-center justify-center bg-background p-6">
      <Card className="w-full max-w-sm border-none py-6 shadow-[0_0_120px_-24px_var(--accent-glow-primary)]">
        <CardHeader className="items-center text-center">
          <div className="mx-auto mb-1 flex size-10 items-center justify-center rounded-md bg-gradient-to-br from-accent-glow-primary to-accent-glow-secondary shadow-[0_0_24px_-6px_var(--accent-glow-primary)]">
            <Server className="size-5 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight">
            HOSTMAN
          </CardTitle>
          <CardDescription>
            Admin sign-in — enter your access token.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {submitError && (
            <Alert
              variant="destructive"
              className="border-none bg-destructive/10 shadow-[0_0_24px_-12px_var(--destructive)]"
            >
              <ShieldAlert />
              <AlertTitle>{submitError.title}</AlertTitle>
              <AlertDescription>{submitError.detail}</AlertDescription>
            </Alert>
          )}
          <form
            onSubmit={(event) => {
              event.preventDefault()
              event.stopPropagation()
              void form.handleSubmit()
            }}
            className="flex flex-col gap-4"
          >
            <form.Field name="token">
              {(field) => {
                const message = field.state.meta.errors
                  .map((error) =>
                    typeof error === "string" ? error : error?.message
                  )
                  .filter(Boolean)[0]
                return (
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor={field.name}>Admin token</Label>
                    <Input
                      id={field.name}
                      name={field.name}
                      type="password"
                      autoComplete="off"
                      autoFocus
                      placeholder="••••••••••••"
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(event) =>
                        field.handleChange(event.target.value)
                      }
                      aria-invalid={
                        field.state.meta.isTouched && !field.state.meta.isValid
                      }
                    />
                    {message && (
                      <p className="text-xs text-destructive">{message}</p>
                    )}
                  </div>
                )
              }}
            </form.Field>
            <form.Subscribe selector={(state) => state.isSubmitting}>
              {(isSubmitting) => (
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-accent-glow-primary text-white shadow-[0_0_24px_-8px_var(--accent-glow-primary)] hover:bg-accent-glow-primary/90"
                >
                  {isSubmitting ? "Verifying…" : "Sign in"}
                </Button>
              )}
            </form.Subscribe>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
