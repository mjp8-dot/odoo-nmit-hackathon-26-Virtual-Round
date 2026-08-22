"use server"

import { requireRole } from "@/features/auth/dal"
import type { ActionResult } from "@/types/api"
import type { PayrollStatus, PayrollSummary } from "@/types/domain"

import { upsertPayroll } from "./repository"
import { upsertPayrollRecordSchema } from "./validation"

export interface UpsertPayrollRecordInput {
  employeeId: string
  periodStart: string
  periodEnd: string
  grossPayMinor: number
  deductionsMinor: number
  currency: string
  status?: PayrollStatus
}

/**
 * Creates or updates the payroll record for an employee's pay period.
 *
 * Authorization: requireRole(["hr", "admin"]) only — requireRole redirects
 * unauthorized callers, so a plain employee can never reach the write path.
 *
 * netPayMinor is always computed server-side from the validated gross and
 * deductions figures; a client-supplied net figure is never trusted.
 *
 * Upserts on the (employee_id, period_start, period_end) unique key.
 */
export async function upsertPayrollRecord(
  input: UpsertPayrollRecordInput,
): Promise<ActionResult<PayrollSummary>> {
  await requireRole(["hr", "admin"])

  const parsed = upsertPayrollRecordSchema.safeParse(input)

  if (!parsed.success) {
    return {
      ok: false,
      error: {
        code: "invalid_input",
        message: "Check the payroll fields and try again.",
        fieldErrors: parsed.error.flatten().fieldErrors,
      },
    }
  }

  const netPayMinor = parsed.data.grossPayMinor - parsed.data.deductionsMinor

  try {
    const summary = await upsertPayroll({
      employeeId: parsed.data.employeeId,
      periodStart: parsed.data.periodStart,
      periodEnd: parsed.data.periodEnd,
      grossPayMinor: parsed.data.grossPayMinor,
      deductionsMinor: parsed.data.deductionsMinor,
      netPayMinor,
      currency: parsed.data.currency,
      status: parsed.data.status ?? "draft",
    })

    return { ok: true, data: summary }
  } catch {
    return {
      ok: false,
      error: {
        code: "internal_error",
        message: "Unable to save the payroll record right now.",
      },
    }
  }
}
