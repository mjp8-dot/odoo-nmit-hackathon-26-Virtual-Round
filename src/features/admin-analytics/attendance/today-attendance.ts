import "server-only"

import { getAttendance } from "@/features/workforce/attendance/queries"
import { getEmployees } from "@/features/workforce/employee/queries"
import type { ActionResult } from "@/types/api"
import type { AttendanceRecord, EmployeeProfile } from "@/types/domain"

const ROSTER_PAGE_SIZE = 100

export interface EmployeeAttendanceRow {
  employee: EmployeeProfile
  record: AttendanceRecord | null
}

export function todayISODate(): string {
  return new Date().toISOString().slice(0, 10)
}

/**
 * Aggregates a single date's attendance across the roster. There is no
 * company-wide attendance query (API_CONTRACT.md only defines getAttendance
 * per employee plus DateRange), so this loads the roster once via
 * getEmployees and fans out getAttendance(employeeId, { startDate: date,
 * endDate: date }) per employee — fine at hackathon scale. Employees with no
 * attendance record for the date still appear, with record: null, so the UI
 * can render "Not checked in" instead of silently dropping them.
 */
export async function getTodayAttendance(
  date: string,
): Promise<ActionResult<EmployeeAttendanceRow[]>> {
  const rosterResult = await getEmployees(
    {},
    { page: 1, pageSize: ROSTER_PAGE_SIZE },
  )

  if (!rosterResult.ok) {
    return rosterResult
  }

  const roster = rosterResult.data.items
  const range = { startDate: date, endDate: date }

  const attendanceResults = await Promise.all(
    roster.map((employee) => getAttendance(employee.id, range)),
  )

  const attendanceFailure = attendanceResults.find((result) => !result.ok)
  if (attendanceFailure && !attendanceFailure.ok) {
    return attendanceFailure
  }

  const entries: EmployeeAttendanceRow[] = roster.map((employee, index) => {
    const result = attendanceResults[index]

    if (!result.ok) return { employee, record: null }

    const record = result.data.find((r) => r.workDate === date) ?? null
    return { employee, record }
  })

  return { ok: true, data: entries }
}
