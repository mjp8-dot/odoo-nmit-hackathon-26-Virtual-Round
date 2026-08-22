import Link from "next/link"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { Department, EmployeeProfile } from "@/types/domain"

import { EmploymentStatusBadge, WorkModeBadge } from "./status-badges"

interface EmployeeTableProps {
  employees: EmployeeProfile[]
  departments: Department[]
}

export function EmployeeTable({ employees, departments }: EmployeeTableProps) {
  const departmentNameById = new Map(
    departments.map((department) => [department.id, department.name]),
  )

  return (
    <div className="overflow-hidden rounded-xl ring-1 ring-foreground/10">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="pl-4">Employee</TableHead>
            <TableHead>Department</TableHead>
            <TableHead>Designation</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Work mode</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {employees.map((employee) => (
            <TableRow key={employee.id}>
              <TableCell className="pl-4">
                <Link
                  className="block hover:underline"
                  href={`/admin/employees/${employee.id}`}
                >
                  <span className="font-medium">{employee.fullName}</span>
                  <span className="block text-xs text-muted-foreground">
                    {employee.employeeCode} · {employee.email}
                  </span>
                </Link>
              </TableCell>
              <TableCell>
                {employee.departmentId
                  ? (departmentNameById.get(employee.departmentId) ??
                    "Unknown")
                  : (
                    <span className="text-muted-foreground">
                      Unassigned
                    </span>
                  )}
              </TableCell>
              <TableCell>{employee.designation}</TableCell>
              <TableCell>
                <EmploymentStatusBadge status={employee.employmentStatus} />
              </TableCell>
              <TableCell>
                <WorkModeBadge mode={employee.defaultWorkMode} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
