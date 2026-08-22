import type { Metadata } from "next"

import {
  getPayrollRoster,
  PayrollTable,
} from "@/features/admin-analytics/payroll/payroll-table"
import {
  EmptyState,
  ErrorState,
} from "@/features/admin-analytics/shared/state-cards"
import { requireRole } from "@/features/auth/dal"

export const metadata: Metadata = {
  title: "Payroll",
}

export default async function AdminPayrollPage() {
  // Layout already gates every /admin route to hr/admin; this call is
  // defense in depth and keeps the authorization boundary visible directly
  // on the page that reads and writes workforce-wide payroll data.
  await requireRole(["hr", "admin"])

  const result = await getPayrollRoster()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Payroll</h1>
        <p className="text-muted-foreground">
          Manage payroll records and view payslip status.
        </p>
      </div>

      {!result.ok ? (
        <ErrorState
          message={result.error.message}
          title="Unable to load payroll records"
        />
      ) : result.data.length === 0 ? (
        <EmptyState
          description="There are no employees in the roster yet."
          title="No employees found"
        />
      ) : (
        <PayrollTable rows={result.data} />
      )}
    </div>
  )
}
