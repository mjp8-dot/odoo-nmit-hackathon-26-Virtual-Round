import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { LeaveRequest, LeaveStatus } from "@/types/domain"

import { reviewLeaveRequestFormAction } from "./actions"

interface LeaveRequestTableProps {
  leaveRequests: LeaveRequest[]
  employeeNameById: Map<string, string>
}

const STATUS_LABEL: Record<LeaveStatus, string> = {
  pending: "Pending",
  approved: "Approved",
  rejected: "Rejected",
  cancelled: "Cancelled",
}

const STATUS_VARIANT: Record<
  LeaveStatus,
  "secondary" | "outline" | "destructive"
> = {
  pending: "outline",
  approved: "secondary",
  rejected: "destructive",
  cancelled: "outline",
}

function LeaveStatusBadge({ status }: { status: LeaveStatus }) {
  return <Badge variant={STATUS_VARIANT[status]}>{STATUS_LABEL[status]}</Badge>
}

function formatDate(isoDate: string): string {
  return new Date(`${isoDate}T00:00:00Z`).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  })
}

function formatDateRange(startDate: string, endDate: string): string {
  return startDate === endDate
    ? formatDate(startDate)
    : `${formatDate(startDate)} – ${formatDate(endDate)}`
}

function formatLeaveType(leaveType: string): string {
  const spaced = leaveType.replace(/_/g, " ")
  return spaced.charAt(0).toUpperCase() + spaced.slice(1)
}

export function LeaveRequestTable({
  leaveRequests,
  employeeNameById,
}: LeaveRequestTableProps) {
  return (
    <div className="overflow-hidden rounded-xl ring-1 ring-foreground/10">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="pl-4">Employee</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Dates</TableHead>
            <TableHead>Days</TableHead>
            <TableHead>Reason</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="pr-4">Review</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {leaveRequests.map((request) => (
            <TableRow key={request.id}>
              <TableCell className="pl-4 font-medium">
                {employeeNameById.get(request.employeeId) ?? "Unknown"}
              </TableCell>
              <TableCell>{formatLeaveType(request.leaveType)}</TableCell>
              <TableCell className="whitespace-nowrap">
                {formatDateRange(request.startDate, request.endDate)}
              </TableCell>
              <TableCell>{request.dayCount}</TableCell>
              <TableCell className="max-w-xs">
                <span className="line-clamp-2 text-sm text-muted-foreground">
                  {request.reason}
                </span>
              </TableCell>
              <TableCell>
                <LeaveStatusBadge status={request.status} />
              </TableCell>
              <TableCell className="pr-4">
                {request.status === "pending" ? (
                  <form
                    action={reviewLeaveRequestFormAction}
                    className="flex flex-col gap-2"
                  >
                    <input
                      name="leaveRequestId"
                      type="hidden"
                      value={request.id}
                    />
                    <textarea
                      className="h-16 w-48 rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
                      name="note"
                      placeholder="Optional note"
                    />
                    <div className="flex gap-2">
                      <Button name="decision" size="sm" type="submit" value="approved">
                        Approve
                      </Button>
                      <Button
                        name="decision"
                        size="sm"
                        type="submit"
                        value="rejected"
                        variant="destructive"
                      >
                        Reject
                      </Button>
                    </div>
                  </form>
                ) : (
                  <div className="text-xs text-muted-foreground">
                    <p>
                      By{" "}
                      {request.reviewedBy
                        ? (employeeNameById.get(request.reviewedBy) ??
                          "Unknown")
                        : "—"}
                      {request.reviewedAt
                        ? ` on ${formatDate(request.reviewedAt.slice(0, 10))}`
                        : null}
                    </p>
                    {request.reviewNote ? (
                      <p className="mt-1 italic">&ldquo;{request.reviewNote}&rdquo;</p>
                    ) : null}
                  </div>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
