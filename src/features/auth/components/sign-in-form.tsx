"use client"

import { useActionState } from "react"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

import { signIn } from "../actions"
import { INITIAL_SIGN_IN_STATE } from "../types"

interface SignInFormProps {
  nextPath?: string
}

export function SignInForm({ nextPath }: SignInFormProps) {
  const [state, formAction, pending] = useActionState(
    signIn,
    INITIAL_SIGN_IN_STATE,
  )

  return (
    <form action={formAction} className="space-y-4">
      {nextPath ? <input name="next" type="hidden" value={nextPath} /> : null}

      <div className="space-y-2">
        <Label htmlFor="email">Work email</Label>
        <Input
          aria-describedby={state.fieldErrors?.email ? "email-error" : undefined}
          aria-invalid={Boolean(state.fieldErrors?.email)}
          autoComplete="email"
          id="email"
          name="email"
          placeholder="you@company.com"
          required
          type="email"
        />
        {state.fieldErrors?.email?.[0] ? (
          <p className="text-xs text-destructive" id="email-error">
            {state.fieldErrors.email[0]}
          </p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input
          aria-describedby={
            state.fieldErrors?.password ? "password-error" : undefined
          }
          aria-invalid={Boolean(state.fieldErrors?.password)}
          autoComplete="current-password"
          id="password"
          name="password"
          required
          type="password"
        />
        {state.fieldErrors?.password?.[0] ? (
          <p className="text-xs text-destructive" id="password-error">
            {state.fieldErrors.password[0]}
          </p>
        ) : null}
      </div>

      {state.message ? (
        <Alert variant="destructive">
          <AlertDescription>{state.message}</AlertDescription>
        </Alert>
      ) : null}

      <Button className="w-full" disabled={pending} size="lg" type="submit">
        {pending ? "Signing in..." : "Sign in"}
      </Button>
    </form>
  )
}

