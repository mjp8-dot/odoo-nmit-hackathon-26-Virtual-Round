import { LogOut } from "lucide-react"
import type { ReactNode } from "react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { signOut } from "@/features/auth/actions"
import { requireRole } from "@/features/auth/dal"
import { AdminNav } from "@/features/admin-analytics/nav/admin-nav"

/**
 * Admin shell layout. This is the real, server-side authorization boundary
 * for every route under this group — requireRole redirects unauthenticated
 * or non hr/admin users before any child route renders. UI navigation
 * visibility is convenience only, never a substitute for this check.
 */
export default async function AdminLayout({
  children,
}: {
  children: ReactNode
}) {
  const { profile, role, email } = await requireRole(["hr", "admin"])

  const displayName = profile?.fullName ?? email ?? "HR team"
  const roleLabel = role === "admin" ? "Admin" : "HR"

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <aside className="flex shrink-0 flex-col gap-4 border-b border-border bg-sidebar px-4 py-4 md:w-64 md:border-b-0 md:border-r md:px-4 md:py-6">
        <div className="flex items-center justify-between gap-2 md:flex-col md:items-start">
          <div>
            <p className="font-heading text-lg font-semibold text-sidebar-foreground">
              Dayflow
            </p>
            <p className="text-xs text-muted-foreground">HR admin console</p>
          </div>
        </div>

        <AdminNav />

        <div className="mt-auto hidden md:block">
          <Separator className="mb-4" />
          <div className="space-y-3">
            <div className="space-y-1">
              <p className="truncate text-sm font-medium text-sidebar-foreground">
                {displayName}
              </p>
              <Badge variant="outline">{roleLabel}</Badge>
            </div>
            <form action={signOut}>
              <Button className="w-full" type="submit" variant="outline">
                <LogOut />
                Sign out
              </Button>
            </form>
          </div>
        </div>
      </aside>

      <div className="flex flex-1 flex-col">
        <header className="flex items-center justify-between gap-3 border-b border-border px-4 py-3 md:hidden">
          <div>
            <p className="truncate text-sm font-medium">{displayName}</p>
            <Badge variant="outline">{roleLabel}</Badge>
          </div>
          <form action={signOut}>
            <Button size="sm" type="submit" variant="outline">
              <LogOut />
              Sign out
            </Button>
          </form>
        </header>

        <main className="flex-1 px-4 py-6 md:px-8 md:py-8">{children}</main>
      </div>
    </div>
  )
}
