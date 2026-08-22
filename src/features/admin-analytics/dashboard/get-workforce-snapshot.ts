import "server-only"

import { getAttendance } from "@/features/workforce/attendance/queries"
import { getEmployees } from "@/features/workforce/employee/queries"
import { getLeaveRequests } from "@/features/workforce/leave/queries"
import type { ActionResult } from "@/types/api"
import type { EmployeeProfile, WorkforceSnapshot } from "@/types/domain"

// Roster is paged through in chunks this large; capped by MAX_ROSTER_PAGES
// below so a runaway employee count can never turn the dashboard into an
// unbounded fan-out of requests.
const ROSTER_PAGE_SIZE = 100
const MAX_ROSTER_PAGES = 10

function todayISODate(): string {
  return new Date().toISOString().slice(0, 10)
}

/**
 * Loads every employee in the workforce by paging through getEmployees.
 * Stops early once a page reports no further pages, or once the safety cap
 * is hit (protects the dashboard from an unbounded fan-out on very large
 * rosters — a page/pageSize UI is the right long-term fix, out of scope for
 * this aggregation).
 */
async function loadFullRoster(): Promise<
  ActionResult<EmployeeProfile[]>
> {
  const roster: EmployeeProfile[] = []

  for (let page = 1; page <= MAX_ROSTER_PAGES; page += 1) {
    const result = await getEmployees(
      {},
      { page, pageSize: ROSTER_PAGE_SIZE },
    )

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

/**
 * Aggregates a WorkforceSnapshot for the HR dashboard. This module never
 * queries Supabase directly — every fact comes from the existing
 * src/features/workforce read functions (getEmployees, getAttendance,
 * getLeaveRequests). It only counts and combines what those reads already
 * return, so it cannot drift from the attendance/leave business rules that
 * own those definitions.
 */
export async function getWorkforceSnapshot(): Promise<
  ActionResult<WorkforceSnapshot>
> {
  const rosterResult = await loadFullRoster()

  if (!rosterResult.ok) {
    return rosterResult
  }

  const roster = rosterResult.data
  const totalEmployees = roster.length
  const activeEmployees = roster.filter(
    (employee) => employee.employmentStatus === "active",
  ).length

  const today = todayISODate()
  const todayRange = { startDate: today, endDate: today }

  const activeRoster = roster.filter(
    (employee) => employee.employmentStatus === "active",
  )

  const attendanceResults = await Promise.all(
    activeRoster.map((employee) => getAttendance(employee.id, todayRange)),
  )

  let presentToday = 0
  let remoteToday = 0
  let onLeaveToday = 0

  for (const result of attendanceResults) {
    if (!result.ok) {
      // Do not let one employee's attendance lookup failure sink the whole
      // dashboard — that employee is simply excluded from today's counts.
      continue
    }

    const todaysRecord = result.data.find(
      (record) => record.workDate === today,
    )

    if (!todaysRecord) {
      continue
    }

    if (todaysRecord.status === "present" || todaysRecord.status === "partial") {
      presentToday += 1
      if (todaysRecord.workMode === "remote") {
        remoteToday += 1
      }
    } else if (todaysRecord.status === "on_leave") {
      onLeaveToday += 1
    }
  }

  const pendingLeaveResult = await getLeaveRequests({ status: "pending" })

  if (!pendingLeaveResult.ok) {
    return pendingLeaveResult
  }

  const pendingApprovals = pendingLeaveResult.data.length

  const attendanceRate =
    activeEmployees > 0
      ? Math.round((presentToday / activeEmployees) * 1000) / 10
      : 0

  return {
    ok: true,
    data: {
      totalEmployees,
      activeEmployees,
      presentToday,
      remoteToday,
      onLeaveToday,
      pendingApprovals,
      attendanceRate,
    },
  }
}
