import "server-only"

import { z } from "zod"

import { requireUser } from "@/features/auth/dal"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import type { ActionResult } from "@/types/api"
import type { AttendanceRecord, DateRange, UserRole } from "@/types/domain"

import { AttendanceRepositoryError, listAttendanceInRange } from "./repository"

const ROLES_ALLOWED_TO_VIEW_OTHERS: readonly UserRole[] = ["hr", "admin"]

const getAttendanceInputSchema = z
  .object({
    employeeId: z.uuid(),
    startDate: z.iso.date(),
    endDate: z.iso.date(),
  })
  .refine((value) => value.startDate <= value.endDate, {
    message: "startDate must not be after endDate.",
    path: ["startDate"],
  })

/**
 * Internal read for Server Components: loads an employee's attendance
 * records within an inclusive date range. Callers may always read their
 * own attendance; reading someone else's requires an "hr" or "admin" role.
 */
export async function getAttendance(
  employeeId: string,
  range: DateRange,
): Promise<ActionResult<AttendanceRecord[]>> {
  const parsed = getAttendanceInputSchema.safeParse({
    employeeId,
    startDate: range.startDate,
    endDate: range.endDate,
  })

  if (!parsed.success) {
    return {
      ok: false,
      error: {
        code: "invalid_input",
        message: "Check the requested employee id and date range.",
        fieldErrors: parsed.error.flatten().fieldErrors,
      },
    }
  }

  // requireUser() may redirect an unauthenticated caller; keep it outside
  // the try/catch so that redirect propagates untouched.
  const context = await requireUser()

  const isOwnRecord = context.userId === parsed.data.employeeId
  const canViewOthers =
    !!context.role && ROLES_ALLOWED_TO_VIEW_OTHERS.includes(context.role)

  if (!isOwnRecord && !canViewOthers) {
    return {
      ok: false,
      error: {
        code: "forbidden",
        message: "You are not allowed to view this employee's attendance.",
      },
    }
  }

  try {
    const supabase = await createServerSupabaseClient()
    const records = await listAttendanceInRange(
      supabase,
      parsed.data.employeeId,
      parsed.data.startDate,
      parsed.data.endDate,
    )

    return { ok: true, data: records }
  } catch (error) {
    if (error instanceof AttendanceRepositoryError) {
      return { ok: false, error: { code: "internal_error", message: error.message } }
    }

    return {
      ok: false,
      error: {
        code: "internal_error",
        message: "Something went wrong while loading attendance. Try again.",
      },
    }
  }
}
