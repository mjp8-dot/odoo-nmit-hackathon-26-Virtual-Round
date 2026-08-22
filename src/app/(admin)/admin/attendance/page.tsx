import type { Metadata } from "next"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { AttendanceTable } from "@/features/admin-analytics/attendance/attendance-table"
import {
  getTodayAttendance,
  todayISODate,
} from "@/features/admin-analytics/attendance/today-attendance"
import {
  EmptyState,
  ErrorState,
} from "@/features/admin-analytics/shared/state-cards"
import { requireRole } from "@/features/auth/dal"

export const metadata: Metadata = {
  title: "Attendance",
}

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/

function addDays(date: string, delta: number): string {
  const [year, month, day] = date.split("-").map(Number)
  const next = new Date(Date.UTC(year, month - 1, day + delta))
  return next.toISOString().slice(0, 10)
}

function firstValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value
}

interface AttendancePageProps {
  searchParams: Promise<{ date?: string | string[] }>
}

export default async function AdminAttendancePage({
  searchParams,
}: AttendancePageProps) {
  // Layout already gates every /admin route to hr/admin; this call is
  // defense in depth and keeps the authorization boundary visible directly
  // on the page that reads workforce-wide attendance.
  await requireRole(["hr", "admin"])

  const params = await searchParams
  const rawDate = firstValue(params.date)
  const date =
    rawDate && DATE_PATTERN.test(rawDate) ? rawDate : todayISODate()

  const result = await getTodayAttendance(date)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Attendance</h1>
        <p className="text-muted-foreground">
          Review office, remote, and hybrid attendance across the workforce.
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Button asChild size="sm" variant="outline">
            <Link href={`/admin/attendance?date=${addDays(date, -1)}`}>
              ← Previous day
            </Link>
          </Button>
          <span className="text-sm font-medium">{date}</span>
          <Button asChild size="sm" variant="outline">
            <Link href={`/admin/attendance?date=${addDays(date, 1)}`}>
              Next day →
            </Link>
          </Button>
        </div>

        <form className="flex items-center gap-2" method="get">
          <Input
            className="w-40"
            defaultValue={date}
            max={todayISODate()}
            name="date"
            type="date"
          />
          <Button size="sm" type="submit">
            Go
          </Button>
        </form>
      </div>

      {!result.ok ? (
        <ErrorState
          message={result.error.message}
          title="Unable to load attendance"
        />
      ) : result.data.length === 0 ? (
        <EmptyState
          description="There are no employees in the roster yet."
          title="No employees found"
        />
      ) : (
        <AttendanceTable rows={result.data} />
      )}
    </div>
  )
}
