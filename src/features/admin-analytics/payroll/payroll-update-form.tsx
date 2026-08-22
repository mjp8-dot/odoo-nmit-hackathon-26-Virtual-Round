"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { upsertPayrollRecord } from "@/features/workforce/payroll/actions"
import { PAYROLL_STATUSES } from "@/types/domain"
import type { PayrollStatus, PayrollSummary } from "@/types/domain"

interface PayrollUpdateFormProps {
  employeeId: string
  latest: PayrollSummary | null
}

function minorToDisplay(minor: number): string {
  return (minor / 100).toString()
}

const STATUS_LABEL: Record<PayrollStatus, string> = {
  draft: "Draft",
  published: "Published",
  paid: "Paid",
}

/**
 * Inline per-employee payroll form. Always visible (no row-expand) to keep
 * this simple — favors a quick HR workflow over a fancier interaction.
 * Client-side checks below are UX-only guardrails; upsertPayrollRecord's
 * zod schema (src/features/workforce/payroll/validation.ts) is the real
 * validation gate and is not duplicated here.
 */
export function PayrollUpdateForm({
  employeeId,
  latest,
}: PayrollUpdateFormProps) {
  const router = useRouter()
  const [periodStart, setPeriodStart] = useState(latest?.periodStart ?? "")
  const [periodEnd, setPeriodEnd] = useState(latest?.periodEnd ?? "")
  const [grossPay, setGrossPay] = useState(
    latest ? minorToDisplay(latest.grossPayMinor) : "",
  )
  const [deductions, setDeductions] = useState(
    latest ? minorToDisplay(latest.deductionsMinor) : "0",
  )
  const [currency, setCurrency] = useState(latest?.currency ?? "USD")
  const [status, setStatus] = useState<PayrollStatus>(latest?.status ?? "draft")
  const [fieldError, setFieldError] = useState<string | null>(null)
  const [serverError, setServerError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setFieldError(null)
    setServerError(null)
    setSuccessMessage(null)

    if (!periodStart || !periodEnd) {
      setFieldError("Provide both a period start and end date.")
      return
    }

    if (periodStart > periodEnd) {
      setFieldError("Period start must be on or before period end.")
      return
    }

    const grossValue = Number(grossPay)
    const deductionsValue = Number(deductions)

    if (!Number.isFinite(grossValue) || grossValue < 0) {
      setFieldError("Gross pay must be a non-negative number.")
      return
    }

    if (!Number.isFinite(deductionsValue) || deductionsValue < 0) {
      setFieldError("Deductions must be a non-negative number.")
      return
    }

    if (deductionsValue > grossValue) {
      setFieldError("Deductions cannot exceed gross pay.")
      return
    }

    const trimmedCurrency = currency.trim().toUpperCase()

    if (trimmedCurrency.length !== 3) {
      setFieldError("Use a 3-letter currency code, like USD.")
      return
    }

    startTransition(async () => {
      const result = await upsertPayrollRecord({
        employeeId,
        periodStart,
        periodEnd,
        grossPayMinor: Math.round(grossValue * 100),
        deductionsMinor: Math.round(deductionsValue * 100),
        currency: trimmedCurrency,
        status,
      })

      if (!result.ok) {
        setServerError(result.error.message)
        return
      }

      setSuccessMessage("Payroll record saved.")
      // Re-runs the server-rendered payroll roster so the summary shown
      // above this form reflects the just-saved record.
      router.refresh()
    })
  }

  return (
    <form
      className="grid grid-cols-2 gap-3 border-t border-border pt-3 sm:grid-cols-6"
      onSubmit={handleSubmit}
    >
      <div className="space-y-1.5">
        <Label htmlFor={`period-start-${employeeId}`}>Period start</Label>
        <Input
          id={`period-start-${employeeId}`}
          onChange={(event) => setPeriodStart(event.target.value)}
          required
          type="date"
          value={periodStart}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor={`period-end-${employeeId}`}>Period end</Label>
        <Input
          id={`period-end-${employeeId}`}
          onChange={(event) => setPeriodEnd(event.target.value)}
          required
          type="date"
          value={periodEnd}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor={`gross-${employeeId}`}>Gross pay</Label>
        <Input
          id={`gross-${employeeId}`}
          min={0}
          onChange={(event) => setGrossPay(event.target.value)}
          required
          step="0.01"
          type="number"
          value={grossPay}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor={`deductions-${employeeId}`}>Deductions</Label>
        <Input
          id={`deductions-${employeeId}`}
          min={0}
          onChange={(event) => setDeductions(event.target.value)}
          required
          step="0.01"
          type="number"
          value={deductions}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor={`currency-${employeeId}`}>Currency</Label>
        <Input
          id={`currency-${employeeId}`}
          maxLength={3}
          onChange={(event) => setCurrency(event.target.value)}
          required
          value={currency}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor={`status-${employeeId}`}>Status</Label>
        <select
          className="h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-base outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:text-sm dark:bg-input/30"
          id={`status-${employeeId}`}
          onChange={(event) => setStatus(event.target.value as PayrollStatus)}
          value={status}
        >
          {PAYROLL_STATUSES.map((value) => (
            <option key={value} value={value}>
              {STATUS_LABEL[value]}
            </option>
          ))}
        </select>
      </div>

      {fieldError ? (
        <p className="col-span-2 text-sm text-destructive sm:col-span-6">
          {fieldError}
        </p>
      ) : null}
      {serverError ? (
        <p className="col-span-2 text-sm text-destructive sm:col-span-6">
          {serverError}
        </p>
      ) : null}
      {successMessage ? (
        <p className="col-span-2 text-sm text-emerald-600 sm:col-span-6 dark:text-emerald-400">
          {successMessage}
        </p>
      ) : null}

      <div className="col-span-2 sm:col-span-6">
        <Button disabled={isPending} size="sm" type="submit">
          {isPending ? "Saving…" : "Save payroll record"}
        </Button>
      </div>
    </form>
  )
}
