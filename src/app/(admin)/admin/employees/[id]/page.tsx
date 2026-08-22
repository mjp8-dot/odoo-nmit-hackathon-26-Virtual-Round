import type { Metadata } from "next"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import { EmployeeDetailCard } from "@/features/admin-analytics/employees/employee-detail-card"
import { ErrorState } from "@/features/admin-analytics/shared/state-cards"
import {
  getEmployeeById,
  listDepartments,
} from "@/features/workforce/employee/queries"

export const metadata: Metadata = {
  title: "Employee",
}

interface EmployeeDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function EmployeeDetailPage({
  params,
}: EmployeeDetailPageProps) {
  const { id } = await params

  const [employeeResult, departmentsResult] = await Promise.all([
    getEmployeeById(id),
    listDepartments(),
  ])

  if (!employeeResult.ok) {
    return (
      <div className="space-y-6">
        <Button asChild size="sm" variant="ghost">
          <Link href="/admin/employees">← Back to employees</Link>
        </Button>
        <ErrorState
          message={employeeResult.error.message}
          title={
            employeeResult.error.code === "not_found"
              ? "Employee not found"
              : "Unable to load this employee"
          }
        />
      </div>
    )
  }

  const employee = employeeResult.data
  const departments = departmentsResult.ok ? departmentsResult.data : []
  const department =
    departments.find((item) => item.id === employee.departmentId) ?? null

  const managerResult = employee.managerId
    ? await getEmployeeById(employee.managerId)
    : null
  const manager = managerResult?.ok ? managerResult.data : null

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <Button asChild className="mb-2 -ml-2.5" size="sm" variant="ghost">
            <Link href="/admin/employees">← Back to employees</Link>
          </Button>
          <h1 className="text-2xl font-semibold">{employee.fullName}</h1>
          <p className="text-muted-foreground">
            {employee.designation} · {employee.employeeCode}
          </p>
        </div>
      </div>

      {!departmentsResult.ok ? (
        <ErrorState
          message={departmentsResult.error.message}
          title="Department details unavailable"
        />
      ) : null}

      <EmployeeDetailCard
        department={department}
        employee={employee}
        manager={manager}
      />
    </div>
  )
}
