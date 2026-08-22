import "server-only"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { getEmployees } from "@/features/workforce/employee/queries"
import { getPayrollSummaries } from "@/features/workforce/payroll/queries"
import type { ActionResult } from "@/types/api"
import type { EmployeeProfile, PayrollStatus, PayrollSummary } from "@/types/domain"

import { PayrollUpdateForm } from "./payroll-update-form"

// Mirrors the bounded roster fan-out guard used by the attendance
// aggregator and the dashboard snapshot: a very large roster can never
// turn this into an unbounded fan-out of getPayrollSummaries calls.
const ROSTER_PAGE_SIZE = 100
const MAX_ROSTER_PAGES = 10

export interface EmployeePayrollRow {
  employee: EmployeeProfile
  latest: PayrollSummary | null
}

async function loadRoster(): Promise<ActionResult<EmployeeProfile[]>> {
  const roster: EmployeeProfile[] = []

  for (let page = 1; page <= MAX_ROSTER_PAGES; page += 1) {
    const result = await getEmployees({}, { page, pageSize: ROSTER_PAGE_SIZE })

    if (!result.ok) {
      return result
    }

    roster.push(...result.data.items)

    if (!result.data.hasNextPage) {
      break
    }
  }

  return { ok: true, data: roster }
}

function pickLatest(summaries: PayrollSummary[]): PayrollSummary | null {
  if (summaries.length === 0) {
    return null
  }

  return summaries.reduce((latest, current) =>
    current.periodEnd > latest.periodEnd ? current : latest,
  )
}

/**
 * Loads every employee alongside their most recent payroll record (highest
 * periodEnd), fetched via Promise.all(roster.map(getPayrollSummaries)) —
 * acceptable fan-out at hackathon scale, bounded by the roster page cap
 * above. A per-employee lookup failure degrades that employee to
 * `latest: null` ("No payroll record") rather than failing the whole page.
 */
export async function getPayrollRoster(): Promise<
  ActionResult<EmployeePayrollRow[]>
> {
  const rosterResult = await loadRoster()

  if (!rosterResult.ok) {
    return rosterResult
  }

  const roster = rosterResult.data

  const summaryResults = await Promise.all(
    roster.map((employee) => getPayrollSummaries(employee.id)),
  )

  const rows: EmployeePayrollRow[] = roster.map((employee, index) => {
    const result = summaryResults[index]
    const latest = result.ok ? pickLatest(result.data) : null

    return { employee, latest }
  })

  return { ok: true, data: rows }
}

const STATUS_LABEL: Record<PayrollStatus, string> = {
  draft: "Draft",
  published: "Published",
  paid: "Paid",
}

const STATUS_VARIANT: Record<
  PayrollStatus,
  "secondary" | "outline" | "default"
> = {
  draft: "outline",
  published: "secondary",
  paid: "default",
}

function formatMoney(minor: number, currency: string): string {
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency,
    }).format(minor / 100)
  } catch {
    // Unknown/invalid currency code — fall back to a plain decimal amount
    // with the code alongside instead of throwing.
    return `${(minor / 100).toFixed(2)} ${currency}`
  }
}

interface PayrollTableProps {
  rows: EmployeePayrollRow[]
}

export function PayrollTable({ rows }: PayrollTableProps) {
  return (
    <div className="space-y-4">
      {rows.map(({ employee, latest }) => (
        <Card key={employee.id}>
          <CardContent className="space-y-4">
            <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-start">
              <div>
                <p className="font-medium">{employee.fullName}</p>
                <p className="text-xs text-muted-foreground">
                  {employee.employeeCode} · {employee.email}
                </p>
              </div>

              {latest ? (
                <div className="text-right text-sm">
                  <p>
                    Gross {formatMoney(latest.grossPayMinor, latest.currency)}{" "}
                    · Deductions{" "}
                    {formatMoney(latest.deductionsMinor, latest.currency)} ·
                    Net {formatMoney(latest.netPayMinor, latest.currency)}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {latest.periodStart} – {latest.periodEnd}
                  </p>
                  <Badge className="mt-1" variant={STATUS_VARIANT[latest.status]}>
                    {STATUS_LABEL[latest.status]}
                  </Badge>
                </div>
              ) : (
                <Badge variant="outline">No payroll record</Badge>
              )}
            </div>

            <PayrollUpdateForm employeeId={employee.id} latest={latest} />
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
