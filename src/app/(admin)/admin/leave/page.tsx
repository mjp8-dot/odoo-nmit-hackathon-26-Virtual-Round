import type { Metadata } from "next"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import { LeaveRequestTable } from "@/features/admin-analytics/leave/leave-request-table"
import { EmptyState, ErrorState } from "@/features/admin-analytics/shared/state-cards"
import { requireRole } from "@/features/auth/dal"
import { getEmployees } from "@/features/workforce/employee/queries"
import { getLeaveRequests } from "@/features/workforce/leave/queries"
import { LEAVE_STATUSES, type LeaveStatus } from "@/types/domain"

export const metadata: Metadata = {
  title: "Leave requests",
}

const STATUS_FILTERS = ["all", ...LEAVE_STATUSES] as const
type StatusFilter = (typeof STATUS_FILTERS)[number]

const FILTER_LABEL: Record<StatusFilter, string> = {
  all: "All",
  pending: "Pending",
  approved: "Approved",
  rejected: "Rejected",
  cancelled: "Cancelled",
}

interface AdminLeavePageProps {
  searchParams: Promise<{ status?: string | string[] }>
}

function firstValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value
}

function isStatusFilter(value: string): value is StatusFilter {
  return (STATUS_FILTERS as readonly string[]).includes(value)
}

export default async function AdminLeavePage({
  searchParams,
}: AdminLeavePageProps) {
  // The (admin) layout already runs requireRole(["hr", "admin"]) as the real
  // authorization boundary for every route in this group. This call is
  // redundant with that guard but keeps this page self-contained/visible as
  // an authorization boundary in its own right, matching every other admin
  // page's convention.
  await requireRole(["hr", "admin"])

  const params = await searchParams
  const rawStatus = firstValue(params.status)?.trim()
  const statusFilter: StatusFilter =
    rawStatus && isStatusFilter(rawStatus) ? rawStatus : "pending"

  const scopeStatus: LeaveStatus | undefined =
    statusFilter === "all" ? undefined : statusFilter

  const [leaveRequestsResult, employeesResult] = await Promise.all([
    getLeaveRequests({ status: scopeStatus }),
    getEmployees({}, { page: 1, pageSize: 100 }),
  ])

  const employeeNameById = new Map(
    employeesResult.ok
      ? employeesResult.data.items.map((employee) => [
          employee.id,
          employee.fullName,
        ])
      : [],
  )

  function buildStatusHref(status: StatusFilter) {
    return status === "pending"
      ? "/admin/leave"
      : `/admin/leave?status=${status}`
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Leave requests</h1>
        <p className="text-muted-foreground">
          Review and decide on pending leave requests.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {STATUS_FILTERS.map((status) => (
          <Button
            asChild
            key={status}
            size="sm"
            variant={status === statusFilter ? "default" : "outline"}
          >
            <Link href={buildStatusHref(status)}>{FILTER_LABEL[status]}</Link>
          </Button>
        ))}
      </div>

      {!employeesResult.ok ? (
        <ErrorState
          message={employeesResult.error.message}
          title="Employee names unavailable"
        />
      ) : null}

      {!leaveRequestsResult.ok ? (
        <ErrorState
          message={leaveRequestsResult.error.message}
          title="Unable to load leave requests"
        />
      ) : leaveRequestsResult.data.length === 0 ? (
        <EmptyState
          description={
            statusFilter === "all"
              ? "No leave requests have been submitted yet."
              : `No ${FILTER_LABEL[statusFilter].toLowerCase()} leave requests right now.`
          }
          title="No leave requests"
        />
      ) : (
        <LeaveRequestTable
          employeeNameById={employeeNameById}
          leaveRequests={leaveRequestsResult.data}
        />
      )}
    </div>
  )
}
