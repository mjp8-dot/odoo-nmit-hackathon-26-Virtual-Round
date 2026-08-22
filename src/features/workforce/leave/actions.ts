"use server"

import { requireRole, requireUser } from "@/features/auth/dal"
import type { ActionResult } from "@/types/api"
import type {
  LeaveDecisionInput,
  LeaveRequest,
  LeaveRequestCreateInput,
} from "@/types/domain"

import {
  LeaveRepositoryError,
  findLeaveRequestById,
  insertLeaveRequest,
  transitionLeaveRequestStatus,
} from "./repository"
import {
  cancelLeaveRequestSchema,
  reviewLeaveRequestSchema,
  submitLeaveRequestSchema,
} from "./validation"

function internalErrorResult(message: string): ActionResult<never> {
  return {
    ok: false,
    error: { code: "internal_error", message },
  }
}

/**
 * Inclusive calendar day count between two YYYY-MM-DD dates. Computed
 * server-side only — LeaveRequestCreateInput intentionally has no dayCount
 * field, so a client can never supply its own count.
 */
function calculateDayCount(startDate: string, endDate: string): number {
  const start = Date.parse(`${startDate}T00:00:00Z`)
  const end = Date.parse(`${endDate}T00:00:00Z`)
  const diffDays = Math.round((end - start) / (24 * 60 * 60 * 1000))
  return diffDays + 1
}

export async function submitLeaveRequest(
  input: LeaveRequestCreateInput,
): Promise<ActionResult<LeaveRequest>> {
  const { userId } = await requireUser()

  const parsed = submitLeaveRequestSchema.safeParse(input)

  if (!parsed.success) {
    return {
      ok: false,
      error: {
        code: "invalid_input",
        message: "Check the highlighted fields and try again.",
        fieldErrors: parsed.error.flatten().fieldErrors,
      },
    }
  }

  const { leaveType, startDate, endDate, reason } = parsed.data
  const dayCount = calculateDayCount(startDate, endDate)

  try {
    const leaveRequest = await insertLeaveRequest({
      employeeId: userId,
      leaveType,
      startDate,
      endDate,
      dayCount,
      reason,
    })

    return { ok: true, data: leaveRequest }
  } catch (error) {
    if (error instanceof LeaveRepositoryError) {
      return internalErrorResult("Unable to submit the leave request.")
    }

    throw error
  }
}

export async function cancelLeaveRequest(
  leaveRequestId: string,
): Promise<ActionResult<LeaveRequest>> {
  const { userId } = await requireUser()

  const parsedId = cancelLeaveRequestSchema.safeParse(leaveRequestId)

  if (!parsedId.success) {
    return {
      ok: false,
      error: {
        code: "invalid_input",
        message: "Enter a valid leave request id.",
      },
    }
  }

  try {
    const existing = await findLeaveRequestById(parsedId.data)

    if (!existing) {
      return {
        ok: false,
        error: { code: "not_found", message: "Leave request not found." },
      }
    }

    if (existing.employeeId !== userId) {
      return {
        ok: false,
        error: {
          code: "forbidden",
          message: "You cannot cancel someone else's leave request.",
        },
      }
    }

    if (existing.status !== "pending") {
      return {
        ok: false,
        error: {
          code: "conflict",
          message: "Only a pending leave request can be cancelled.",
        },
      }
    }

    const updated = await transitionLeaveRequestStatus(
      parsedId.data,
      "pending",
      { status: "cancelled" },
    )

    if (!updated) {
      return {
        ok: false,
        error: {
          code: "conflict",
          message: "Only a pending leave request can be cancelled.",
        },
      }
    }

    return { ok: true, data: updated }
  } catch (error) {
    if (error instanceof LeaveRepositoryError) {
      return internalErrorResult("Unable to cancel the leave request.")
    }

    throw error
  }
}

export async function reviewLeaveRequest(
  input: LeaveDecisionInput,
): Promise<ActionResult<LeaveRequest>> {
  const { userId } = await requireRole(["hr", "admin"])

  const parsed = reviewLeaveRequestSchema.safeParse(input)

  if (!parsed.success) {
    return {
      ok: false,
      error: {
        code: "invalid_input",
        message: "Check the highlighted fields and try again.",
        fieldErrors: parsed.error.flatten().fieldErrors,
      },
    }
  }

  const { leaveRequestId, decision, note } = parsed.data

  try {
    const existing = await findLeaveRequestById(leaveRequestId)

    if (!existing) {
      return {
        ok: false,
        error: { code: "not_found", message: "Leave request not found." },
      }
    }

    if (existing.status !== "pending") {
      return {
        ok: false,
        error: {
          code: "conflict",
          message: "This leave request has already been decided.",
        },
      }
    }

    const updated = await transitionLeaveRequestStatus(
      leaveRequestId,
      "pending",
      {
        status: decision,
        reviewedBy: userId,
        reviewedAt: new Date().toISOString(),
        reviewNote: note ?? null,
      },
    )

    if (!updated) {
      return {
        ok: false,
        error: {
          code: "conflict",
          message: "This leave request has already been decided.",
        },
      }
    }

    return { ok: true, data: updated }
  } catch (error) {
    if (error instanceof LeaveRepositoryError) {
      return internalErrorResult("Unable to review the leave request.")
    }

    throw error
  }
}
