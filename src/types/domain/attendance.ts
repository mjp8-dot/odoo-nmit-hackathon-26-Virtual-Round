import type { AuditFields, GeoPoint, ISODate, ISODateTime, UUID } from "./common"

export const WORK_MODES = ["office", "remote", "hybrid"] as const
export const ATTENDANCE_STATUSES = [
  "present",
  "absent",
  "partial",
  "on_leave",
] as const

export type WorkMode = (typeof WORK_MODES)[number]
export type AttendanceStatus = (typeof ATTENDANCE_STATUSES)[number]

export interface AttendanceRecord extends AuditFields {
  id: UUID
  employeeId: UUID
  workDate: ISODate
  workMode: WorkMode
  checkInAt: ISODateTime | null
  checkOutAt: ISODateTime | null
  workedMinutes: number
  status: AttendanceStatus
  notes: string | null
  location: GeoPoint | null
}

export interface AttendanceCheckInInput {
  workMode: WorkMode
  occurredAt?: ISODateTime
  location?: GeoPoint
  notes?: string
}

export interface AttendanceCheckOutInput {
  attendanceId: UUID
  occurredAt?: ISODateTime
  location?: GeoPoint
}

