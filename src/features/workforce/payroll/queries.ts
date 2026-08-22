import "server-only"

import { requireUser } from "@/features/auth/dal"
import type { ActionResult } from "@/types/api"
import type { DateRange, PayrollSummary } from "@/types/domain"

import { findPayrollSummaries } from "./repository"

/**
 * Reserved workforce contract op (API_CONTRACT.md): getPayrollSummaries.
 *
 * Authorization: requireUser() then a per-resource check — allowed when the
 * caller is requesting their own payroll OR the caller's role is hr/admin.
 * Any other caller gets a "forbidden" ActionResult; a plain employee can
 * never pass an arbitrary employeeId to see someone else's payroll.
 *
 * Only PayrollSummary columns are selected/returned — no unrelated profile
 * or salary-structure internals leak through this path.
 */
export async function getPayrollSummaries(
  employeeId: string,
  range?: DateRange,
): Promise<ActionResult<PayrollSummary[]>> {
  const context = await requireUser()

  const isSelf = context.userId === employeeId
  const isPrivileged = context.role === "hr" || context.role === "admin"

  if (!isSelf && !isPrivileged) {
    return {
      ok: false,
      error: {
        code: "forbidden",
        message: "You are not allowed to view this payroll data.",
      },
    }
  }

  try {
    const summaries = await findPayrollSummaries(employeeId, range)
    return { ok: true, data: summaries }
  } catch {
    return {
      ok: false,
      error: {
        code: "internal_error",
        message: "Unable to load payroll records right now.",
      },
    }
  }
}
