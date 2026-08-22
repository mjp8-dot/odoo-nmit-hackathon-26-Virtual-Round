import { z } from "zod"

import { PAYROLL_STATUSES } from "@/types/domain"

const isoDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Use a YYYY-MM-DD date.")

export const upsertPayrollRecordSchema = z
  .object({
    employeeId: z.uuid("Provide a valid employee ID."),
    periodStart: isoDateSchema,
    periodEnd: isoDateSchema,
    grossPayMinor: z
      .number()
      .int("Gross pay must be a whole number of minor units.")
      .min(0, "Gross pay cannot be negative."),
    deductionsMinor: z
      .number()
      .int("Deductions must be a whole number of minor units.")
      .min(0, "Deductions cannot be negative."),
    currency: z
      .string()
      .trim()
      .length(3, "Use a 3-letter currency code.")
      .transform((value) => value.toUpperCase()),
    status: z.enum(PAYROLL_STATUSES).optional(),
  })
  .refine((value) => value.periodStart <= value.periodEnd, {
    message: "Period start must be on or before period end.",
    path: ["periodEnd"],
  })
  .refine((value) => value.deductionsMinor <= value.grossPayMinor, {
    message: "Deductions cannot exceed gross pay.",
    path: ["deductionsMinor"],
  })

export type UpsertPayrollRecordInput = z.infer<typeof upsertPayrollRecordSchema>
