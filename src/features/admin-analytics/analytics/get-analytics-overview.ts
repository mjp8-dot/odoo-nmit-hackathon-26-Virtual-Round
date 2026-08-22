import "server-only"

import { getAttendance } from "@/features/workforce/attendance/queries"
import { getEmployees, listDepartments } from "@/features/workforce/employee/queries"
import { getLeaveRequests } from "@/features/workforce/leave/queries"
import { getPayrollSummaries } from "@/features/workforce/payroll/queries"
import type { ActionResult } from "@/types/api"
import type {
  AttendanceRecord,
  Department,
  EmployeeProfile,
  LeaveRequest,
  LeaveStatus,
  PayrollStatus,
  PayrollSummary,
  WorkMode,
} from "@/types/domain"

const ROSTER_PAGE_SIZE = 100
const MAX_ROSTER_PAGES = 10
const DAY_MS = 24 * 60 * 60 * 1000

export interface AttendanceTrendPoint {
  date: string
  label: string
  present: number
  partial: number
  absent: number
  onLeave: number
  remote: number
  attendanceRate: number
}

export interface LeaveTrendPoint {
  label: string
  pending: number
  approved: number
  rejected: number
  cancelled: number
}

export interface DistributionPoint {
  name: string
  value: number
}

export interface PayrollOverview {
  currency: string
  grossPayMinor: number
  deductionsMinor: number
  netPayMinor: number
  employeesWithPayroll: number
  draftCount: number
  publishedCount: number
  paidCount: number
}

export interface AnalyticsOverview {
  attendanceTrend: AttendanceTrendPoint[]
  leaveTrend: LeaveTrendPoint[]
  departmentDistribution: DistributionPoint[]
  workModeDistribution: DistributionPoint[]
  leaveStatusDistribution: DistributionPoint[]
  payroll: PayrollOverview
  insights: string[]
}

async function loadFullRoster(): Promise<ActionResult<EmployeeProfile[]>> {
  const roster: EmployeeProfile[] = []

  for (let page = 1; page <= MAX_ROSTER_PAGES; page += 1) {
    const result = await getEmployees({}, { page, pageSize: ROSTER_PAGE_SIZE })

    if (!result.ok) {
      return result
    }

    roster.push(...result.data.items)

    if (!result.data.hasNextPage) {
      break
    }
  }

  return { ok: true, data: roster }
}

function isoDateFromOffset(deltaDays: number): string {
  const date = new Date(Date.now() + deltaDays * DAY_MS)
  return date.toISOString().slice(0, 10)
}

function shortDateLabel(isoDate: string): string {
  return new Date(`${isoDate}T00:00:00Z`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  })
}

function formatWorkMode(workMode: WorkMode): string {
  const labels: Record<WorkMode, string> = {
    office: "Office",
    remote: "Remote",
    hybrid: "Hybrid",
  }

  return labels[workMode]
}

function percent(numerator: number, denominator: number): number {
  return denominator > 0 ? Math.round((numerator / denominator) * 1000) / 10 : 0
}

function pickLatestPayroll(records: PayrollSummary[]): PayrollSummary | null {
  if (records.length === 0) {
    return null
  }

  return records.reduce((latest, current) =>
    current.periodEnd > latest.periodEnd ? current : latest,
  )
}

function buildAttendanceTrend(
  activeRoster: EmployeeProfile[],
  attendanceByEmployee: AttendanceRecord[][],
  dates: string[],
): AttendanceTrendPoint[] {
  return dates.map((date) => {
    let present = 0
    let partial = 0
    let explicitAbsent = 0
    let onLeave = 0
    let remote = 0

    for (const records of attendanceByEmployee) {
      const record = records.find((item) => item.workDate === date)

      if (!record) {
        continue
      }

      if (record.status === "present") present += 1
      if (record.status === "partial") partial += 1
      if (record.status === "absent") explicitAbsent += 1
      if (record.status === "on_leave") onLeave += 1
      if (
        record.workMode === "remote" &&
        (record.status === "present" || record.status === "partial")
      ) {
        remote += 1
      }
    }

    const accounted = present + partial + explicitAbsent + onLeave
    const missing = Math.max(activeRoster.length - accounted, 0)
    const absent = explicitAbsent + missing

    return {
      date,
      label: shortDateLabel(date),
      present,
      partial,
      absent,
      onLeave,
      remote,
      attendanceRate: percent(present + partial, activeRoster.length),
    }
  })
}

function buildLeaveTrend(leaveRequests: LeaveRequest[]): LeaveTrendPoint[] {
  const buckets = [
    { label: "3 weeks ago", start: isoDateFromOffset(-27), end: isoDateFromOffset(-21) },
    { label: "2 weeks ago", start: isoDateFromOffset(-20), end: isoDateFromOffset(-14) },
    { label: "Last week", start: isoDateFromOffset(-13), end: isoDateFromOffset(-7) },
    { label: "This week", start: isoDateFromOffset(-6), end: isoDateFromOffset(0) },
  ]

  return buckets.map((bucket) => {
    const point: LeaveTrendPoint = {
      label: bucket.label,
      pending: 0,
      approved: 0,
      rejected: 0,
      cancelled: 0,
    }

    for (const request of leaveRequests) {
      const createdDate = request.createdAt.slice(0, 10)

      if (createdDate < bucket.start || createdDate > bucket.end) {
        continue
      }

      point[request.status] += 1
    }

    return point
  })
}

function buildDepartmentDistribution(
  roster: EmployeeProfile[],
  departments: Department[],
): DistributionPoint[] {
  const departmentNameById = new Map(
    departments.map((department) => [department.id, department.name]),
  )
  const counts = new Map<string, number>()

  for (const employee of roster) {
    const name = employee.departmentId
      ? (departmentNameById.get(employee.departmentId) ?? "Unassigned")
      : "Unassigned"
    counts.set(name, (counts.get(name) ?? 0) + 1)
  }

  return [...counts.entries()]
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value || a.name.localeCompare(b.name))
}

function buildWorkModeDistribution(roster: EmployeeProfile[]): DistributionPoint[] {
  const counts: Record<WorkMode, number> = {
    office: 0,
    remote: 0,
    hybrid: 0,
  }

  for (const employee of roster) {
    counts[employee.defaultWorkMode] += 1
  }

  return Object.entries(counts).map(([mode, value]) => ({
    name: formatWorkMode(mode as WorkMode),
    value,
  }))
}

function buildLeaveStatusDistribution(
  leaveRequests: { status: LeaveStatus }[],
): DistributionPoint[] {
  const labels: Record<LeaveStatus, string> = {
    pending: "Pending",
    approved: "Approved",
    rejected: "Rejected",
    cancelled: "Cancelled",
  }
  const counts: Record<LeaveStatus, number> = {
    pending: 0,
    approved: 0,
    rejected: 0,
    cancelled: 0,
  }

  for (const request of leaveRequests) {
    counts[request.status] += 1
  }

  return Object.entries(counts).map(([status, value]) => ({
    name: labels[status as LeaveStatus],
    value,
  }))
}

function buildPayrollOverview(records: PayrollSummary[]): PayrollOverview {
  const latestRecords = records.filter(Boolean)
  const statusCounts: Record<PayrollStatus, number> = {
    draft: 0,
    published: 0,
    paid: 0,
  }
  const currency = latestRecords[0]?.currency ?? "INR"

  let grossPayMinor = 0
  let deductionsMinor = 0
  let netPayMinor = 0

  for (const record of latestRecords) {
    statusCounts[record.status] += 1
    grossPayMinor += record.grossPayMinor
    deductionsMinor += record.deductionsMinor
    netPayMinor += record.netPayMinor
  }

  return {
    currency,
    grossPayMinor,
    deductionsMinor,
    netPayMinor,
    employeesWithPayroll: latestRecords.length,
    draftCount: statusCounts.draft,
    publishedCount: statusCounts.published,
    paidCount: statusCounts.paid,
  }
}

function buildInsights(options: {
  attendanceTrend: AttendanceTrendPoint[]
  departmentDistribution: DistributionPoint[]
  leaveRequests: { employeeId: string; status: LeaveStatus }[]
  payroll: PayrollOverview
  roster: EmployeeProfile[]
  departments: Department[]
}): string[] {
  const {
    attendanceTrend,
    departmentDistribution,
    leaveRequests,
    payroll,
    roster,
    departments,
  } = options
  const weeklyPresent = attendanceTrend.reduce(
    (sum, point) => sum + point.present + point.partial,
    0,
  )
  const weeklyCapacity = attendanceTrend.reduce(
    (sum, point) =>
      sum + point.present + point.partial + point.absent + point.onLeave,
    0,
  )
  const weeklyAttendanceRate = percent(weeklyPresent, weeklyCapacity)
  const today = attendanceTrend.at(-1)
  const remoteEmployees = roster.filter(
    (employee) => employee.defaultWorkMode === "remote",
  ).length
  const departmentNameById = new Map(
    departments.map((department) => [department.id, department.name]),
  )
  const employeeById = new Map(roster.map((employee) => [employee.id, employee]))
  const pendingByDepartment = new Map<string, number>()

  for (const request of leaveRequests) {
    if (request.status !== "pending") {
      continue
    }

    const employee = employeeById.get(request.employeeId)
    const departmentName = employee?.departmentId
      ? (departmentNameById.get(employee.departmentId) ?? "Unassigned")
      : "Unassigned"

    pendingByDepartment.set(
      departmentName,
      (pendingByDepartment.get(departmentName) ?? 0) + 1,
    )
  }

  const topPendingDepartment = [...pendingByDepartment.entries()].sort(
    (a, b) => b[1] - a[1] || a[0].localeCompare(b[0]),
  )[0]
  const largestDepartment = departmentDistribution[0]
  const insights = [
    `Attendance this week is ${weeklyAttendanceRate}%.`,
    `${today?.absent ?? 0} active employees are absent or not checked in today.`,
    `${today?.remote ?? remoteEmployees} employees are currently remote.`,
  ]

  if (topPendingDepartment) {
    insights.push(
      `${topPendingDepartment[0]} has ${topPendingDepartment[1]} pending leave request${topPendingDepartment[1] === 1 ? "" : "s"}.`,
    )
  }

  if (payroll.employeesWithPayroll > 0) {
    insights.push(
      `Latest payroll covers ${payroll.employeesWithPayroll} employee${payroll.employeesWithPayroll === 1 ? "" : "s"}.`,
    )
  }

  if (largestDepartment) {
    insights.push(
      `${largestDepartment.name} is the largest department with ${largestDepartment.value} employee${largestDepartment.value === 1 ? "" : "s"}.`,
    )
  }

  return insights
}

export async function getAnalyticsOverview(): Promise<
  ActionResult<AnalyticsOverview>
> {
  const [rosterResult, departmentsResult, leaveRequestsResult] =
    await Promise.all([loadFullRoster(), listDepartments(), getLeaveRequests({})])

  if (!rosterResult.ok) return rosterResult
  if (!departmentsResult.ok) return departmentsResult
  if (!leaveRequestsResult.ok) return leaveRequestsResult

  const roster = rosterResult.data
  const activeRoster = roster.filter(
    (employee) => employee.employmentStatus === "active",
  )
  const dates = Array.from({ length: 7 }, (_, index) =>
    isoDateFromOffset(index - 6),
  )
  const range = { startDate: dates[0], endDate: dates[dates.length - 1] }

  const [attendanceResults, payrollResults] = await Promise.all([
    Promise.all(activeRoster.map((employee) => getAttendance(employee.id, range))),
    Promise.all(roster.map((employee) => getPayrollSummaries(employee.id))),
  ])

  const attendanceFailure = attendanceResults.find((result) => !result.ok)
  if (attendanceFailure && !attendanceFailure.ok) return attendanceFailure

  const payrollFailure = payrollResults.find((result) => !result.ok)
  if (payrollFailure && !payrollFailure.ok) return payrollFailure

  const attendanceByEmployee = attendanceResults.map((result) =>
    result.ok ? result.data : [],
  )
  const latestPayrollRecords = payrollResults
    .map((result) => (result.ok ? pickLatestPayroll(result.data) : null))
    .filter((record): record is PayrollSummary => record !== null)

  const attendanceTrend = buildAttendanceTrend(
    activeRoster,
    attendanceByEmployee,
    dates,
  )
  const leaveTrend = buildLeaveTrend(leaveRequestsResult.data)
  const departmentDistribution = buildDepartmentDistribution(
    roster,
    departmentsResult.data,
  )
  const workModeDistribution = buildWorkModeDistribution(activeRoster)
  const leaveStatusDistribution = buildLeaveStatusDistribution(
    leaveRequestsResult.data,
  )
  const payroll = buildPayrollOverview(latestPayrollRecords)
  const insights = buildInsights({
    attendanceTrend,
    departmentDistribution,
    leaveRequests: leaveRequestsResult.data,
    payroll,
    roster: activeRoster,
    departments: departmentsResult.data,
  })

  return {
    ok: true,
    data: {
      attendanceTrend,
      leaveTrend,
      departmentDistribution,
      workModeDistribution,
      leaveStatusDistribution,
      payroll,
      insights,
    },
  }
}
