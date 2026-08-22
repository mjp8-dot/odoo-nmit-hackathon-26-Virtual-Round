"use server"

import { requireUser } from "@/features/auth/dal"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import type { ActionResult } from "@/types/api"
import type { Json } from "@/types/database"
import type {
  AttendanceCheckInInput,
  AttendanceCheckOutInput,
  AttendanceRecord,
  GeoPoint,
} from "@/types/domain"

import {
  AttendanceRepositoryError,
  findAttendanceById,
  findAttendanceForDate,
  insertAttendance,
  updateAttendance,
} from "./repository"
import { checkInSchema, checkOutSchema } from "./validation"

/** Minimum worked minutes for a day to count as a full "present" day. */
const FULL_DAY_MINUTES = 240

function todayWorkDate(): string {
  return new Date().toISOString().slice(0, 10)
}

/**
 * Resolves the server-authoritative timestamp to use for a check-in or
 * check-out event. `occurredAt`, when supplied, is only an optional
 * override for demo/testing and is clamped so it can never land in the
 * future — anything missing, unparsable, or in the future falls back to
 * the server clock.
 */
function resolveServerTimestamp(occurredAt: string | undefined): number {
  const now = Date.now()

  if (!occurredAt) {
    return now
  }

  const parsed = new Date(occurredAt).getTime()

  if (Number.isNaN(parsed) || parsed > now) {
    return now
  }

  return parsed
}

/**
 * GeoPoint is a plain-data interface without a declared index signature,
 * so it needs an explicit cast to satisfy the Json column type. The shape
 * (numbers and optional strings) is always valid Json.
 */
function toLocationJson(location: GeoPoint | null): Json | null {
  return location as unknown as Json | null
}

function toInternalErrorResult(error: unknown): ActionResult<never> {
  if (error instanceof AttendanceRepositoryError) {
    return { ok: false, error: { code: "internal_error", message: error.message } }
  }

  return {
    ok: false,
    error: {
      code: "internal_error",
      message: "Something went wrong while processing attendance. Try again.",
    },
  }
}

/**
 * Checks the current authenticated user in for today. The employee id is
 * always the authenticated user's id — it is never accepted from client
 * input. Fails with "conflict" when today's record is already checked in.
 */
export async function checkIn(
  input: AttendanceCheckInInput,
): Promise<ActionResult<AttendanceRecord>> {
  const parsed = checkInSchema.safeParse(input)

  if (!parsed.success) {
    return {
      ok: false,
      error: {
        code: "invalid_input",
        message: "Check the attendance check-in fields and try again.",
        fieldErrors: parsed.error.flatten().fieldErrors,
      },
    }
  }

  // requireUser() may redirect an unauthenticated caller. That redirect must
  // propagate to Next.js untouched, so it stays outside the try/catch below.
  const { userId } = await requireUser()

  try {
    const supabase = await createServerSupabaseClient()
    const workDate = todayWorkDate()

    const existing = await findAttendanceForDate(supabase, userId, workDate)

    if (existing?.checkInAt) {
      return {
        ok: false,
        error: {
          code: "conflict",
          message: "Attendance for today has already been checked in.",
        },
      }
    }

    const checkInAt = new Date(
      resolveServerTimestamp(parsed.data.occurredAt),
    ).toISOString()

    // Never require or fabricate geolocation for remote/hybrid work — only
    // office check-ins may persist a supplied location.
    const location = toLocationJson(
      parsed.data.workMode === "office" ? (parsed.data.location ?? null) : null,
    )
    const notes = parsed.data.notes ?? null

    const record = existing
      ? await updateAttendance(supabase, existing.id, {
          work_mode: parsed.data.workMode,
          check_in_at: checkInAt,
          status: "present",
          notes,
          location,
        })
      : await insertAttendance(supabase, {
          employee_id: userId,
          work_date: workDate,
          work_mode: parsed.data.workMode,
          check_in_at: checkInAt,
          status: "present",
          notes,
          location,
        })

    return { ok: true, data: record }
  } catch (error) {
    return toInternalErrorResult(error)
  }
}

/**
 * Checks the current authenticated user out of an attendance record they
 * own. Worked minutes are always computed server-side from the stored
 * check-in time — never from client input.
 */
export async function checkOut(
  input: AttendanceCheckOutInput,
): Promise<ActionResult<AttendanceRecord>> {
  const parsed = checkOutSchema.safeParse(input)

  if (!parsed.success) {
    return {
      ok: false,
      error: {
        code: "invalid_input",
        message: "Check the attendance check-out fields and try again.",
        fieldErrors: parsed.error.flatten().fieldErrors,
      },
    }
  }

  // See the note in checkIn(): keep requireUser() outside the try/catch so
  // an unauthenticated redirect is never swallowed as an internal_error.
  const { userId } = await requireUser()

  try {
    const supabase = await createServerSupabaseClient()
    const record = await findAttendanceById(supabase, parsed.data.attendanceId)

    if (!record) {
      return {
        ok: false,
        error: {
          code: "not_found",
          message: "Attendance record was not found.",
        },
      }
    }

    if (record.employeeId !== userId) {
      return {
        ok: false,
        error: {
          code: "forbidden",
          message: "You cannot check out someone else's attendance.",
        },
      }
    }

    if (!record.checkInAt) {
      return {
        ok: false,
        error: {
          code: "conflict",
          message: "Cannot check out before checking in.",
        },
      }
    }

    if (record.checkOutAt) {
      return {
        ok: false,
        error: {
          code: "conflict",
          message: "Attendance has already been checked out.",
        },
      }
    }

    const checkInMs = new Date(record.checkInAt).getTime()
    const checkOutMs = resolveServerTimestamp(parsed.data.occurredAt)

    if (checkOutMs < checkInMs) {
      return {
        ok: false,
        error: {
          code: "invalid_input",
          message: "Check-out time cannot be before check-in time.",
        },
      }
    }

    const workedMinutes = Math.max(
      0,
      Math.round((checkOutMs - checkInMs) / 60_000),
    )
    const status = workedMinutes >= FULL_DAY_MINUTES ? "present" : "partial"

    // Office check-ins may refresh their stored location on checkout;
    // remote/hybrid records never persist a location.
    const location = toLocationJson(
      record.workMode === "office"
        ? (parsed.data.location ?? record.location)
        : record.location,
    )

    const updated = await updateAttendance(supabase, record.id, {
      check_out_at: new Date(checkOutMs).toISOString(),
      worked_minutes: workedMinutes,
      status,
      location,
    })

    return { ok: true, data: updated }
  } catch (error) {
    return toInternalErrorResult(error)
  }
}
