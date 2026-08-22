import type { Metadata } from "next"
import Link from "next/link"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { SignInForm } from "@/features/auth/components/sign-in-form"
import { getSafeRedirectPath } from "@/features/auth/redirects"

export const metadata: Metadata = {
  title: "Sign in",
}

interface SignInPageProps {
  searchParams: Promise<{
    error?: string | string[]
    next?: string | string[]
  }>
}

export default async function SignInPage({ searchParams }: SignInPageProps) {
  const params = await searchParams
  const nextValue = Array.isArray(params.next) ? params.next[0] : params.next
  const errorValue = Array.isArray(params.error) ? params.error[0] : params.error
  const nextPath = getSafeRedirectPath(nextValue)
  const errorMessage =
    errorValue === "configuration"
      ? "Supabase is not configured for this environment."
      : errorValue === "callback"
        ? "We could not complete the sign-in callback. Please try again."
        : null

  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/30 px-6 py-12">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-3">
          <Badge className="w-fit" variant="outline">
            Secure access
          </Badge>
          <div>
            <CardTitle className="text-2xl">Welcome to Dayflow</CardTitle>
            <CardDescription className="mt-2">
              Sign in with the employee account provisioned by your HR team.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {errorMessage ? (
            <Alert variant="destructive">
              <AlertDescription>{errorMessage}</AlertDescription>
            </Alert>
          ) : null}
          <SignInForm nextPath={nextPath === "/" ? undefined : nextPath} />
        </CardContent>
        <CardFooter className="justify-center">
          <Button asChild variant="link">
            <Link href="/">Back to foundation overview</Link>
          </Button>
        </CardFooter>
      </Card>
    </main>
  )
}

