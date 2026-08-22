import "server-only"

import { createServerSupabaseClient } from "@/lib/supabase/server"
import type { LeaveRequest, LeaveStatus, LeaveType } from "@/types/domain"
import type { Tables, TablesInsert, TablesUpdate } from "@/types/database"

/**
 * Thrown when a Supabase call fails or returns an unexpected shape. Callers
 * (actions.ts, queries.ts) catch this and translate it into a safe
 * ActionResult with code "internal_error". Never let the underlying
 * Supabase/PostgREST error surface past this module.
 */
export class LeaveRepositoryError extends Error {
  constructor(message = "Unable to complete the leave request operation.") {
    super(message)
    this.name = "LeaveRepositoryError"
  }
}

const LEAVE_REQUEST_COLUMNS =
  "id, employee_id, leave_type, start_date, end_date, day_count, reason, status, reviewed_by, reviewed_at, review_note, created_at, updated_at"

function toLeaveRequest(row: Tables<"leave_requests">): LeaveRequest {
  return {
    id: row.id,
    employeeId: row.employee_id,
    leaveType: row.leave_type,
    startDate: row.start_date,
    endDate: row.end_date,
    dayCount: row.day_count,
    reason: row.reason,
    status: row.status,
    reviewedBy: row.reviewed_by,
    reviewedAt: row.reviewed_at,
    reviewNote: row.review_note,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export interface NewLeaveRequest {
  employeeId: string
  leaveType: LeaveType
  startDate: string
  endDate: string
  dayCount: number
  reason: string
}

export async function insertLeaveRequest(
  input: NewLeaveRequest,
): Promise<LeaveRequest> {
  const supabase = await createServerSupabaseClient()

  const payload: TablesInsert<"leave_requests"> = {
    employee_id: input.employeeId,
    leave_type: input.leaveType,
    start_date: input.startDate,
    end_date: input.endDate,
    day_count: input.dayCount,
    reason: input.reason,
    status: "pending",
  }

  const { data, error } = await supabase
    .from("leave_requests")
    .insert(payload)
    .select(LEAVE_REQUEST_COLUMNS)
    .single()

  if (error || !data) {
    throw new LeaveRepositoryError()
  }

  return toLeaveRequest(data)
}

export async function findLeaveRequestById(
  id: string,
): Promise<LeaveRequest | null> {
  const supabase = await createServerSupabaseClient()

  const { data, error } = await supabase
    .from("leave_requests")
    .select(LEAVE_REQUEST_COLUMNS)
    .eq("id", id)
    .maybeSingle()

  if (error) {
    throw new LeaveRepositoryError()
  }

  return data ? toLeaveRequest(data) : null
}

export type LeaveTransitionPatch =
  | { status: Extract<LeaveStatus, "cancelled"> }
  | {
      status: Extract<LeaveStatus, "approved" | "rejected">
      reviewedBy: string
      reviewedAt: string
      reviewNote: string | null
    }

/**
 * Conditionally updates a leave request's status, requiring the row to
 * currently be in `expectedStatus`. This closes the load-then-write race
 * window: if another request already transitioned the row, zero rows match
 * and this returns null instead of clobbering a concurrent decision.
 */
export async function transitionLeaveRequestStatus(
  id: string,
  expectedStatus: LeaveStatus,
  patch: LeaveTransitionPatch,
): Promise<LeaveRequest | null> {
  const supabase = await createServerSupabaseClient()

  const updatePayload: TablesUpdate<"leave_requests"> =
    patch.status === "cancelled"
      ? { status: "cancelled" }
      : {
          status: patch.status,
          reviewed_by: patch.reviewedBy,
          reviewed_at: patch.reviewedAt,
          review_note: patch.reviewNote,
        }

  const { data, error } = await supabase
    .from("leave_requests")
    .update(updatePayload)
    .eq("id", id)
    .eq("status", expectedStatus)
    .select(LEAVE_REQUEST_COLUMNS)
    .maybeSingle()

  if (error) {
    throw new LeaveRepositoryError()
  }

  return data ? toLeaveRequest(data) : null
}

export interface LeaveRequestScope {
  employeeId?: string
  status?: LeaveStatus
}

export async function listLeaveRequests(
  scope: LeaveRequestScope,
): Promise<LeaveRequest[]> {
  const supabase = await createServerSupabaseClient()

  let query = supabase.from("leave_requests").select(LEAVE_REQUEST_COLUMNS)

  if (scope.employeeId) {
    query = query.eq("employee_id", scope.employeeId)
  }

  if (scope.status) {
    query = query.eq("status", scope.status)
  }

  const { data, error } = await query.order("created_at", {
    ascending: false,
  })

  if (error || !data) {
    throw new LeaveRepositoryError()
  }

  return data.map(toLeaveRequest)
}
