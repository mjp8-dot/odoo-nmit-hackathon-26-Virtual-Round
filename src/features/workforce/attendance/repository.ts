import "server-only"

import type { createServerSupabaseClient } from "@/lib/supabase/server"
import type { Tables, TablesInsert, TablesUpdate } from "@/types/database"
import type { AttendanceRecord, GeoPoint } from "@/types/domain"

type SupabaseServerClient = Awaited<ReturnType<typeof createServerSupabaseClient>>

/**
 * Thrown when a Supabase operation fails. Carries only a safe, generic
 * message — the underlying Supabase/Postgres error is attached as `cause`
 * for server-side logging only and must never be forwarded to a caller.
 */
export class AttendanceRepositoryError extends Error {
  constructor(message: string, cause?: unknown) {
    super(message, { cause })
    this.name = "AttendanceRepositoryError"
  }
}

function isGeoPoint(value: unknown): value is GeoPoint {
  if (typeof value !== "object" || value === null) {
    return false
  }

  const candidate = value as Record<string, unknown>
  return (
    typeof candidate.latitude === "number" &&
    typeof candidate.longitude === "number"
  )
}

function toGeoPoint(value: unknown): GeoPoint | null {
  return isGeoPoint(value) ? value : null
}

function toAttendanceRecord(row: Tables<"attendance_records">): AttendanceRecord {
  return {
    id: row.id,
    employeeId: row.employee_id,
    workDate: row.work_date,
    workMode: row.work_mode,
    checkInAt: row.check_in_at,
    checkOutAt: row.check_out_at,
    workedMinutes: row.worked_minutes,
    status: row.status,
    notes: row.notes,
    location: toGeoPoint(row.location),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

/**
 * Finds the attendance record for a given employee on a given work date
 * (YYYY-MM-DD). Returns null when no record exists yet for that day.
 */
export async function findAttendanceForDate(
  supabase: SupabaseServerClient,
  employeeId: string,
  workDate: string,
): Promise<AttendanceRecord | null> {
  const { data, error } = await supabase
    .from("attendance_records")
    .select("*")
    .eq("employee_id", employeeId)
    .eq("work_date", workDate)
    .maybeSingle()

  if (error) {
    throw new AttendanceRepositoryError(
      "Failed to look up attendance for the given date.",
      error,
    )
  }

  return data ? toAttendanceRecord(data) : null
}

/**
 * Finds an attendance record by its primary key. Returns null when no
 * record exists with that id.
 */
export async function findAttendanceById(
  supabase: SupabaseServerClient,
  attendanceId: string,
): Promise<AttendanceRecord | null> {
  const { data, error } = await supabase
    .from("attendance_records")
    .select("*")
    .eq("id", attendanceId)
    .maybeSingle()

  if (error) {
    throw new AttendanceRepositoryError(
      "Failed to look up the attendance record.",
      error,
    )
  }

  return data ? toAttendanceRecord(data) : null
}

/**
 * Inserts a new attendance record and returns the mapped domain record.
 */
export async function insertAttendance(
  supabase: SupabaseServerClient,
  values: TablesInsert<"attendance_records">,
): Promise<AttendanceRecord> {
  const { data, error } = await supabase
    .from("attendance_records")
    .insert(values)
    .select("*")
    .single()

  if (error || !data) {
    throw new AttendanceRepositoryError(
      "Failed to create the attendance record.",
      error,
    )
  }

  return toAttendanceRecord(data)
}

/**
 * Updates an existing attendance record by id and returns the mapped
 * domain record.
 */
export async function updateAttendance(
  supabase: SupabaseServerClient,
  attendanceId: string,
  values: TablesUpdate<"attendance_records">,
): Promise<AttendanceRecord> {
  const { data, error } = await supabase
    .from("attendance_records")
    .update(values)
    .eq("id", attendanceId)
    .select("*")
    .single()

  if (error || !data) {
    throw new AttendanceRepositoryError(
      "Failed to update the attendance record.",
      error,
    )
  }

  return toAttendanceRecord(data)
}

/**
 * Lists attendance records for an employee within an inclusive work-date
 * range (YYYY-MM-DD), ordered oldest to newest.
 */
export async function listAttendanceInRange(
  supabase: SupabaseServerClient,
  employeeId: string,
  startDate: string,
  endDate: string,
): Promise<AttendanceRecord[]> {
  const { data, error } = await supabase
    .from("attendance_records")
    .select("*")
    .eq("employee_id", employeeId)
    .gte("work_date", startDate)
    .lte("work_date", endDate)
    .order("work_date", { ascending: true })

  if (error) {
    throw new AttendanceRepositoryError(
      "Failed to load attendance records.",
      error,
    )
  }

  return (data ?? []).map(toAttendanceRecord)
}
