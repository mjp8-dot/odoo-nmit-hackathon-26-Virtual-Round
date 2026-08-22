import type { Metadata } from "next"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export const metadata: Metadata = {
  title: "Access denied",
}

export default function UnauthorizedPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/30 px-6 py-12">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Access denied</CardTitle>
          <CardDescription>
            Your account does not have permission to open this area.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          If your role recently changed, sign out and back in. Otherwise, contact
          an HR administrator.
        </CardContent>
        <CardFooter className="gap-2">
          <Button asChild>
            <Link href="/">Return home</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/sign-in">Sign in again</Link>
          </Button>
        </CardFooter>
      </Card>
    </main>
  )
}

