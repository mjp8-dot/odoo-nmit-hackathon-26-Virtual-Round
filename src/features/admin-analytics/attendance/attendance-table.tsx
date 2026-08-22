import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { AttendanceStatus, WorkMode } from "@/types/domain"

import type { EmployeeAttendanceRow } from "./today-attendance"

const STATUS_LABEL: Record<AttendanceStatus, string> = {
  present: "Present",
  absent: "Absent",
  partial: "Partial",
  on_leave: "On leave",
}

const STATUS_VARIANT: Record<
  AttendanceStatus,
  "secondary" | "outline" | "destructive"
> = {
  present: "secondary",
  partial: "outline",
  on_leave: "outline",
  absent: "destructive",
}

const WORK_MODE_LABEL: Record<WorkMode, string> = {
  office: "Office",
  remote: "Remote",
  hybrid: "Hybrid",
}

function formatTime(value: string | null): string {
  if (!value) {
    return "—"
  }

  const parsed = new Date(value)

  if (Number.isNaN(parsed.getTime())) {
    return "—"
  }

  return parsed.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  })
}

interface AttendanceTableProps {
  rows: EmployeeAttendanceRow[]
}

export function AttendanceTable({ rows }: AttendanceTableProps) {
  return (
    <div className="overflow-hidden rounded-xl ring-1 ring-foreground/10">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="pl-4">Employee</TableHead>
            <TableHead>Work mode</TableHead>
            <TableHead>Check-in</TableHead>
            <TableHead>Check-out</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Notes</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map(({ employee, record }) => (
            <TableRow key={employee.id}>
              <TableCell className="pl-4">
                <span className="block font-medium">{employee.fullName}</span>
                <span className="block text-xs text-muted-foreground">
                  {employee.employeeCode} · {employee.email}
                </span>
              </TableCell>
              <TableCell>
                {WORK_MODE_LABEL[record?.workMode ?? employee.defaultWorkMode]}
              </TableCell>
              <TableCell>{formatTime(record?.checkInAt ?? null)}</TableCell>
              <TableCell>{formatTime(record?.checkOutAt ?? null)}</TableCell>
              <TableCell>
                {record ? (
                  <Badge variant={STATUS_VARIANT[record.status]}>
                    {STATUS_LABEL[record.status]}
                  </Badge>
                ) : (
                  <Badge variant="outline">Not checked in</Badge>
                )}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {record?.notes ?? "—"}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
