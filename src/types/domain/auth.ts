import type { EmployeeProfile } from "./employee"
import type { UUID } from "./common"

export const USER_ROLES = ["employee", "hr", "admin"] as const

export type UserRole = (typeof USER_ROLES)[number]

export const ROLE_HOME_ROUTE: Record<UserRole, string> = {
  employee: "/employee",
  hr: "/admin",
  admin: "/admin",
}

export interface AuthContext {
  userId: UUID
  email: string | null
  role: UserRole | null
  profile: EmployeeProfile | null
}

