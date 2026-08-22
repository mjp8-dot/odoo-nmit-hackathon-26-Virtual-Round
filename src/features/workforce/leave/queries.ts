import "server-only"

import { requireUser } from "@/features/auth/dal"
import type { ActionResult } from "@/types/api"
import type { LeaveRequest, LeaveStatus } from "@/types/domain"

import { LeaveRepositoryError, listLeaveRequests } from "./repository"

export interface LeaveRequestListScope {
  employeeId?: string
  status?: LeaveStatus
}

/**
 * Internal read for Server Components (employee history views, the admin
 * leave-approval UI). Not a Route Handler — matches API_CONTRACT.md's
 * transport rule that internal reads run in Server Components or
 * server-only repositories.
 *
 * Authorization:
 * - scope.employeeId === caller's own id (or omitted while the caller is
 *   hr/admin, meaning "all employees"): allowed.
 * - scope.employeeId set to someone else's id: requires hr/admin, else
 *   "forbidden".
 * - scope.employeeId omitted (list everyone): requires hr/admin, else
 *   "forbidden" — a plain employee must never list everyone's requests.
 */
export async function getLeaveRequests(
  scope: LeaveRequestListScope,
): Promise<ActionResult<LeaveRequest[]>> {
  const { userId, role } = await requireUser()

  const isPrivileged = role === "hr" || role === "admin"
  const targetsSomeoneElse = Boolean(
    scope.employeeId && scope.employeeId !== userId,
  )
  const targetsEveryone = !scope.employeeId

  if ((targetsSomeoneElse || targetsEveryone) && !isPrivileged) {
    return {
      ok: false,
      error: {
        code: "forbidden",
        message: "You do not have access to these leave requests.",
      },
    }
  }

  try {
    const items = await listLeaveRequests(scope)
    return { ok: true, data: items }
  } catch (error) {
    if (error instanceof LeaveRepositoryError) {
      return {
        ok: false,
        error: {
          code: "internal_error",
          message: "Unable to load leave requests right now.",
        },
      }
    }

    throw error
  }
}
