import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

import type { AnalyticsOverview, PayrollOverview } from "./get-analytics-overview"

interface AnalyticsSummaryProps {
  overview: AnalyticsOverview
}

interface PayrollSummaryCardProps {
  payroll: PayrollOverview
}

function formatMoney(minor: number, currency: string): string {
  try {
    return new Intl.NumberFormat(undefined, {
      currency,
      maximumFractionDigits: 0,
      style: "currency",
    }).format(minor / 100)
  } catch {
    return `${(minor / 100).toFixed(0)} ${currency}`
  }
}

export function PayrollSummaryCard({ payroll }: PayrollSummaryCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Payroll summary</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div>
            <p className="text-xs text-muted-foreground">Gross payroll</p>
            <p className="text-xl font-semibold tabular-nums">
              {formatMoney(payroll.grossPayMinor, payroll.currency)}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Deductions</p>
            <p className="text-xl font-semibold tabular-nums">
              {formatMoney(payroll.deductionsMinor, payroll.currency)}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Net payroll</p>
            <p className="text-xl font-semibold tabular-nums">
              {formatMoney(payroll.netPayMinor, payroll.currency)}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Badge variant="outline">
            {payroll.employeesWithPayroll} employees with payroll
          </Badge>
          <Badge variant="outline">{payroll.draftCount} draft</Badge>
          <Badge variant="secondary">{payroll.publishedCount} published</Badge>
          <Badge>{payroll.paidCount} paid</Badge>
        </div>
      </CardContent>
    </Card>
  )
}

export function AnalyticsSummary({ overview }: AnalyticsSummaryProps) {
  const latestAttendance = overview.attendanceTrend.at(-1)
  const pendingLeaves =
    overview.leaveStatusDistribution.find((point) => point.name === "Pending")
      ?.value ?? 0

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      <Card>
        <CardHeader>
          <CardTitle>Attendance today</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-semibold tabular-nums">
            {latestAttendance?.attendanceRate ?? 0}%
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {latestAttendance?.present ?? 0} present,{" "}
            {latestAttendance?.partial ?? 0} partial,{" "}
            {latestAttendance?.absent ?? 0} absent or not checked in
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Leave queue</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-semibold tabular-nums">
            {pendingLeaves}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Pending requests awaiting HR review
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Payroll coverage</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-semibold tabular-nums">
            {overview.payroll.employeesWithPayroll}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Employees with a saved payroll record
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
