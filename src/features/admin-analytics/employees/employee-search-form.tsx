import Link from "next/link"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { Department } from "@/types/domain"

interface EmployeeSearchFormProps {
  departments: Department[]
  defaultSearch?: string
  defaultDepartmentId?: string
}

/**
 * Plain GET form — no client JS required. Submitting navigates to
 * /admin/employees?q=...&department=..., which the list page reads as
 * search params and forwards into getEmployees' filter.
 */
export function EmployeeSearchForm({
  departments,
  defaultSearch,
  defaultDepartmentId,
}: EmployeeSearchFormProps) {
  const hasActiveFilter = Boolean(defaultSearch || defaultDepartmentId)

  return (
    <form
      className="flex flex-col gap-3 sm:flex-row sm:items-end sm:gap-3"
      method="get"
    >
      <div className="flex-1 space-y-1.5">
        <Label htmlFor="q">Search</Label>
        <Input
          defaultValue={defaultSearch}
          id="q"
          name="q"
          placeholder="Search by name, email, or employee code"
          type="search"
        />
      </div>

      <div className="space-y-1.5 sm:w-56">
        <Label htmlFor="department">Department</Label>
        <select
          className="h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-base outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:text-sm dark:bg-input/30"
          defaultValue={defaultDepartmentId ?? ""}
          id="department"
          name="department"
        >
          <option value="">All departments</option>
          {departments.map((department) => (
            <option key={department.id} value={department.id}>
              {department.name}
            </option>
          ))}
        </select>
      </div>

      <div className="flex gap-2">
        <Button type="submit">Search</Button>
        {hasActiveFilter ? (
          <Button asChild variant="ghost">
            <Link href="/admin/employees">Clear</Link>
          </Button>
        ) : null}
      </div>
    </form>
  )
}
