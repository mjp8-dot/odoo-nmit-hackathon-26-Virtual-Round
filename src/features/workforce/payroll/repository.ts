import "server-only"

import { createServerSupabaseClient } from "@/lib/supabase/server"
import type { DateRange, PayrollStatus, PayrollSummary } from "@/types/domain"
import type { Tables, TablesInsert } from "@/types/database"

const PAYROLL_COLUMNS =
  "id, employee_id, period_start, period_end, gross_pay_minor, deductions_minor, net_pay_minor, currency, status, payslip_url, paid_at, created_at, updated_at"

function toPayrollSummary(row: Tables<"payroll_records">): PayrollSummary {
  return {
    id: row.id,
    employeeId: row.employee_id,
    periodStart: row.period_start,
    periodEnd: row.period_end,
    grossPayMinor: row.gross_pay_minor,
    deductionsMinor: row.deductions_minor,
    netPayMinor: row.net_pay_minor,
    currency: row.currency,
    status: row.status,
    payslipUrl: row.payslip_url,
    paidAt: row.paid_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export async function findPayrollSummaries(
  employeeId: string,
  range?: DateRange,
): Promise<PayrollSummary[]> {
  const supabase = await createServerSupabaseClient()

  let query = supabase
    .from("payroll_records")
    .select(PAYROLL_COLUMNS)
    .eq("employee_id", employeeId)

  if (range) {
    query = query.gte("period_start", range.startDate).lte("period_end", range.endDate)
  }

  const { data, error } = await query.order("period_start", { ascending: false })

  if (error) {
    throw error
  }

  return (data ?? []).map(toPayrollSummary)
}

export interface PayrollRecordWrite {
  employeeId: string
  periodStart: string
  periodEnd: string
  grossPayMinor: number
  deductionsMinor: number
  netPayMinor: number
  currency: string
  status: PayrollStatus
}

/**
 * Upserts on the (employee_id, period_start, period_end) unique key. This
 * assumes DATABASE_SCHEMA.md defines a matching unique constraint on
 * payroll_records — the primary integrator owns that document, so this
 * repository only encodes the expected conflict target.
 */
export async function upsertPayroll(
  input: PayrollRecordWrite,
): Promise<PayrollSummary> {
  const supabase = await createServerSupabaseClient()

  const row: TablesInsert<"payroll_records"> = {
    employee_id: input.employeeId,
    period_start: input.periodStart,
    period_end: input.periodEnd,
    gross_pay_minor: input.grossPayMinor,
    deductions_minor: input.deductionsMinor,
    net_pay_minor: input.netPayMinor,
    currency: input.currency,
    status: input.status,
  }

  const { data, error } = await supabase
    .from("payroll_records")
    .upsert(row, { onConflict: "employee_id,period_start,period_end" })
    .select(PAYROLL_COLUMNS)
    .single()

  if (error) {
    throw error
  }

  return toPayrollSummary(data)
}
