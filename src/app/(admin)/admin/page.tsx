import type { Metadata } from "next"

import { getWorkforceSnapshot } from "@/features/admin-analytics/dashboard/get-workforce-snapshot"
import { SnapshotCards } from "@/features/admin-analytics/dashboard/snapshot-cards"
import { ErrorState } from "@/features/admin-analytics/shared/state-cards"

export const metadata: Metadata = {
  title: "Dashboard",
}

export default async function AdminDashboardPage() {
  const snapshotResult = await getWorkforceSnapshot()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">HR dashboard</h1>
        <p className="text-muted-foreground">
          Workforce snapshot for today.
        </p>
      </div>

      {snapshotResult.ok ? (
        <SnapshotCards snapshot={snapshotResult.data} />
      ) : (
        <ErrorState
          message={snapshotResult.error.message}
          title="Unable to load the workforce snapshot"
        />
      )}
    </div>
  )
}
