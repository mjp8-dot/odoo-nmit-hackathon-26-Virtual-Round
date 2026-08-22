import type { LucideIcon } from "lucide-react"
import { Clock, Laptop, Percent, UserCheck, Users, UserX } from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { WorkforceSnapshot } from "@/types/domain"

interface SnapshotCardsProps {
  snapshot: WorkforceSnapshot
}

interface MetricCardProps {
  icon: LucideIcon
  label: string
  value: string
  hint?: string
}

function MetricCard({ icon: Icon, label, value, hint }: MetricCardProps) {
  return (
    <Card>
      <CardHeader className="flex items-center justify-between gap-2 space-y-0 pb-0">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {label}
        </CardTitle>
        <Icon className="size-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-semibold tabular-nums">{value}</p>
        {hint ? (
          <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
        ) : null}
      </CardContent>
    </Card>
  )
}

/**
 * HR dashboard metric cards. Purely presentational — every number comes
 * from the WorkforceSnapshot aggregated in get-workforce-snapshot.ts.
 */
export function SnapshotCards({ snapshot }: SnapshotCardsProps) {
  const notPresentToday = Math.max(
    snapshot.activeEmployees - snapshot.presentToday,
    0,
  )

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <MetricCard
        icon={Users}
        label="Total employees"
        value={snapshot.totalEmployees.toLocaleString()}
        hint={`${snapshot.activeEmployees.toLocaleString()} active`}
      />
      <MetricCard
        icon={UserCheck}
        label="Present today"
        value={snapshot.presentToday.toLocaleString()}
      />
      <MetricCard
        icon={UserX}
        label="Absent / on leave today"
        value={notPresentToday.toLocaleString()}
        hint={`${snapshot.onLeaveToday.toLocaleString()} on approved leave`}
      />
      <MetricCard
        icon={Laptop}
        label="Remote today"
        value={snapshot.remoteToday.toLocaleString()}
      />
      <MetricCard
        icon={Clock}
        label="Pending leave requests"
        value={snapshot.pendingApprovals.toLocaleString()}
      />
      <MetricCard
        icon={Percent}
        label="Attendance rate"
        value={`${snapshot.attendanceRate}%`}
        hint="Present today vs. active employees"
      />
    </div>
  )
}
