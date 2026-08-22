import type { Metadata } from "next"

import { PayrollSummaryCard } from "@/features/admin-analytics/analytics/analytics-summary"
import { getAnalyticsOverview } from "@/features/admin-analytics/analytics/get-analytics-overview"
import { getWorkforceSnapshot } from "@/features/admin-analytics/dashboard/get-workforce-snapshot"
import { SnapshotCards } from "@/features/admin-analytics/dashboard/snapshot-cards"
import { HrInsightList } from "@/features/admin-analytics/insights/hr-insight-list"
import { ErrorState } from "@/features/admin-analytics/shared/state-cards"

export const metadata: Metadata = {
  title: "Dashboard",
}

export default async function AdminDashboardPage() {
  const [snapshotResult, analyticsResult] = await Promise.all([
    getWorkforceSnapshot(),
    getAnalyticsOverview(),
  ])

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

      {analyticsResult.ok ? (
        <>
          <PayrollSummaryCard payroll={analyticsResult.data.payroll} />
          <HrInsightList insights={analyticsResult.data.insights.slice(0, 4)} />
        </>
      ) : (
        <ErrorState
          message={analyticsResult.error.message}
          title="Unable to load payroll and insights"
        />
      )}
    </div>
  )
}
