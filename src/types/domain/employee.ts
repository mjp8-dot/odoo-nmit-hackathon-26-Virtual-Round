import type { UserRole } from "./auth"
import type { AuditFields, ISODate, UUID } from "./common"
import type { WorkMode } from "./attendance"

export const EMPLOYMENT_STATUSES = [
  "active",
  "inactive",
  "on_leave",
  "terminated",
] as const

export type EmploymentStatus = (typeof EMPLOYMENT_STATUSES)[number]

export interface Department extends AuditFields {
  id: UUID
  name: string
  code: string
  managerId: UUID | null
}

export interface EmployeeProfile extends AuditFields {
  id: UUID
  employeeCode: string
  email: string
  fullName: string
  phone: string | null
  avatarUrl: string | null
  role: UserRole
  departmentId: UUID | null
  designation: string
  managerId: UUID | null
  joiningDate: ISODate
  employmentStatus: EmploymentStatus
  defaultWorkMode: WorkMode
}

