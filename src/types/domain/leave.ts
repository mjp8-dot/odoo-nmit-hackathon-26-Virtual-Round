import type { AuditFields, ISODate, ISODateTime, UUID } from "./common"

export const LEAVE_TYPES = [
  "annual",
  "sick",
  "casual",
  "unpaid",
  "parental",
  "bereavement",
  "other",
] as const

export const LEAVE_STATUSES = [
  "pending",
  "approved",
  "rejected",
  "cancelled",
] as const

export type LeaveType = (typeof LEAVE_TYPES)[number]
export type LeaveStatus = (typeof LEAVE_STATUSES)[number]

export interface LeaveRequest extends AuditFields {
  id: UUID
  employeeId: UUID
  leaveType: LeaveType
  startDate: ISODate
  endDate: ISODate
  dayCount: number
  reason: string
  status: LeaveStatus
  reviewedBy: UUID | null
  reviewedAt: ISODateTime | null
  reviewNote: string | null
}

export interface LeaveRequestCreateInput {
  leaveType: LeaveType
  startDate: ISODate
  endDate: ISODate
  reason: string
}

export interface LeaveDecisionInput {
  leaveRequestId: UUID
  decision: Extract<LeaveStatus, "approved" | "rejected">
  note?: string
}

