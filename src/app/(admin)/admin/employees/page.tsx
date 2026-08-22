import type { Metadata } from "next"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import { EmployeeSearchForm } from "@/features/admin-analytics/employees/employee-search-form"
import { EmployeeTable } from "@/features/admin-analytics/employees/employee-table"
import { EmptyState, ErrorState } from "@/features/admin-analytics/shared/state-cards"
import { getEmployees, listDepartments } from "@/features/workforce/employee/queries"

export const metadata: Metadata = {
  title: "Employees",
}

const PAGE_SIZE = 20

interface EmployeesPageProps {
  searchParams: Promise<{
    q?: string | string[]
    department?: string | string[]
    page?: string | string[]
  }>
}

function firstValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value
}

export default async function EmployeesPage({
  searchParams,
}: EmployeesPageProps) {
  const params = await searchParams
  const search = firstValue(params.q)?.trim() || undefined
  const departmentId = firstValue(params.department)?.trim() || undefined
  const pageParam = Number(firstValue(params.page))
  const page = Number.isFinite(pageParam) && pageParam > 0 ? Math.floor(pageParam) : 1

  const [employeesResult, departmentsResult] = await Promise.all([
    getEmployees({ search, departmentId }, { page, pageSize: PAGE_SIZE }),
    listDepartments(),
  ])

  const departments = departmentsResult.ok ? departmentsResult.data : []

  function buildPageHref(targetPage: number) {
    const query = new URLSearchParams()
    if (search) query.set("q", search)
    if (departmentId) query.set("department", departmentId)
    if (targetPage > 1) query.set("page", String(targetPage))
    const qs = query.toString()
    return qs ? `/admin/employees?${qs}` : "/admin/employees"
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Employees</h1>
        <p className="text-muted-foreground">
          Search and browse the workforce roster.
        </p>
      </div>

      <EmployeeSearchForm
        defaultDepartmentId={departmentId}
        defaultSearch={search}
        departments={departments}
      />

      {!departmentsResult.ok ? (
        <ErrorState
          message={departmentsResult.error.message}
          title="Department filter unavailable"
        />
      ) : null}

      {!employeesResult.ok ? (
        <ErrorState
          message={employeesResult.error.message}
          title="Unable to load employees"
        />
      ) : employeesResult.data.items.length === 0 ? (
        <EmptyState
          description="Try a different name, employee code, or department filter."
          title="No employees match your search"
        />
      ) : (
        <div className="space-y-4">
          <EmployeeTable
            departments={departments}
            employees={employeesResult.data.items}
          />

          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <p>
              Showing{" "}
              {(employeesResult.data.page - 1) * employeesResult.data.pageSize +
                1}
              –
              {Math.min(
                employeesResult.data.page * employeesResult.data.pageSize,
                employeesResult.data.total,
              )}{" "}
              of {employeesResult.data.total}
            </p>
            <div className="flex gap-2">
              {employeesResult.data.page <= 1 ? (
                <Button disabled size="sm" variant="outline">
                  Previous
                </Button>
              ) : (
                <Button asChild size="sm" variant="outline">
                  <Link href={buildPageHref(employeesResult.data.page - 1)}>
                    Previous
                  </Link>
                </Button>
              )}
              {!employeesResult.data.hasNextPage ? (
                <Button disabled size="sm" variant="outline">
                  Next
                </Button>
              ) : (
                <Button asChild size="sm" variant="outline">
                  <Link href={buildPageHref(employeesResult.data.page + 1)}>
                    Next
                  </Link>
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
