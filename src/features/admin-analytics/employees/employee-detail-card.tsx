import Link from "next/link"
import type { ReactNode } from "react"

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import type { Department, EmployeeProfile } from "@/types/domain"

import { EmploymentStatusBadge, WorkModeBadge } from "./status-badges"

interface EmployeeDetailCardProps {
  employee: EmployeeProfile
  department: Department | null
  manager: EmployeeProfile | null
}

function Field({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="space-y-0.5">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="text-sm font-medium">{value}</dd>
    </div>
  )
}

/**
 * Employee profile, job info, department, and manager. Deliberately omits
 * payroll/salary data — that lives on the payroll route owned by another
 * agent; this card only links there.
 */
export function EmployeeDetailCard({
  employee,
  department,
  manager,
}: EmployeeDetailCardProps) {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Personal information</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Full name" value={employee.fullName} />
            <Field label="Employee code" value={employee.employeeCode} />
            <Field label="Email" value={employee.email} />
            <Field label="Phone" value={employee.phone ?? "—"} />
            <Field
              label="Joining date"
              value={new Date(employee.joiningDate).toLocaleDateString()}
            />
          </dl>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Job information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Designation" value={employee.designation} />
            <Field
              label="Department"
              value={department?.name ?? "Unassigned"}
            />
            <Field
              label="Manager"
              value={
                manager ? (
                  <Link
                    className="hover:underline"
                    href={`/admin/employees/${manager.id}`}
                  >
                    {manager.fullName}
                  </Link>
                ) : (
                  "—"
                )
              }
            />
            <Field label="Role" value={employee.role} />
          </dl>

          <Separator />

          <div className="flex flex-wrap items-center gap-3">
            <EmploymentStatusBadge status={employee.employmentStatus} />
            <WorkModeBadge mode={employee.defaultWorkMode} />
          </div>

          <p className="text-xs text-muted-foreground">
            <Link
              className="hover:underline"
              href={`/admin/payroll?employeeId=${employee.id}`}
            >
              View payroll →
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
