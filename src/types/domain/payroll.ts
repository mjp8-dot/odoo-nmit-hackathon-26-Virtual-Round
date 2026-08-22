import type {
  AuditFields,
  CurrencyCode,
  ISODate,
  ISODateTime,
  UUID,
} from "./common"

export const PAYROLL_STATUSES = ["draft", "published", "paid"] as const

export type PayrollStatus = (typeof PAYROLL_STATUSES)[number]

export interface PayrollSummary extends AuditFields {
  id: UUID
  employeeId: UUID
  periodStart: ISODate
  periodEnd: ISODate
  grossPayMinor: number
  deductionsMinor: number
  netPayMinor: number
  currency: CurrencyCode
  status: PayrollStatus
  payslipUrl: string | null
  paidAt: ISODateTime | null
}

