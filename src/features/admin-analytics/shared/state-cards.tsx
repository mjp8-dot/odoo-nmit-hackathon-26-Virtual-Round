import { AlertTriangle, Inbox } from "lucide-react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Card, CardContent } from "@/components/ui/card"

interface ErrorStateProps {
  title?: string
  message: string
}

/**
 * Shared error state for admin views — rendered whenever a workforce read
 * returns `{ ok: false }`. Never crashes the page; always shows a real
 * message to the HR user.
 */
export function ErrorState({ title = "Something went wrong", message }: ErrorStateProps) {
  return (
    <Alert variant="destructive">
      <AlertTriangle />
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription>{message}</AlertDescription>
    </Alert>
  )
}

interface EmptyStateProps {
  title: string
  description?: string
}

/** Shared empty state for admin list views. */
export function EmptyState({ title, description }: EmptyStateProps) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center gap-2 py-12 text-center">
        <Inbox className="size-8 text-muted-foreground" />
        <p className="font-medium">{title}</p>
        {description ? (
          <p className="max-w-sm text-sm text-muted-foreground">
            {description}
          </p>
        ) : null}
      </CardContent>
    </Card>
  )
}
