import type { Metadata } from "next"

import { AnalyticsCharts } from "@/features/admin-analytics/analytics/analytics-charts"
import {
  AnalyticsSummary,
  PayrollSummaryCard,
} from "@/features/admin-analytics/analytics/analytics-summary"
import { getAnalyticsOverview } from "@/features/admin-analytics/analytics/get-analytics-overview"
import { HrInsightList } from "@/features/admin-analytics/insights/hr-insight-list"
import { ErrorState } from "@/features/admin-analytics/shared/state-cards"
import { requireRole } from "@/features/auth/dal"

export const metadata: Metadata = {
  title: "Analytics",
}

export default async function AdminAnalyticsPage() {
  await requireRole(["hr", "admin"])

  const overviewResult = await getAnalyticsOverview()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Analytics</h1>
        <p className="text-muted-foreground">
          Attendance, leave, payroll, and workforce distribution trends.
        </p>
      </div>

      {!overviewResult.ok ? (
        <ErrorState
          message={overviewResult.error.message}
          title="Unable to load analytics"
        />
      ) : (
        <>
          <AnalyticsSummary overview={overviewResult.data} />
          <PayrollSummaryCard payroll={overviewResult.data.payroll} />
          <HrInsightList insights={overviewResult.data.insights} />
          <AnalyticsCharts overview={overviewResult.data} />
        </>
      )}
    </div>
  )
}
