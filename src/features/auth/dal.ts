import "server-only"

import { cache } from "react"
import { redirect } from "next/navigation"

import { isSupabaseConfigured } from "@/lib/supabase/env"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import type { AuthContext, EmployeeProfile, UserRole } from "@/types/domain"
import type { Tables } from "@/types/database"

function toEmployeeProfile(row: Tables<"profiles">): EmployeeProfile {
  return {
    id: row.id,
    employeeCode: row.employee_code,
    email: row.email,
    fullName: row.full_name,
    phone: row.phone,
    avatarUrl: row.avatar_url,
    role: row.role,
    departmentId: row.department_id,
    designation: row.designation,
    managerId: row.manager_id,
    joiningDate: row.joining_date,
    employmentStatus: row.employment_status,
    defaultWorkMode: row.default_work_mode,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export const getCurrentAuthContext = cache(
  async (): Promise<AuthContext | null> => {
    if (!isSupabaseConfigured()) {
      return null
    }

    const supabase = await createServerSupabaseClient()
    const { data, error } = await supabase.auth.getClaims()
    const claims = data?.claims

    if (error || typeof claims?.sub !== "string") {
      return null
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select(
        "id, employee_code, email, full_name, phone, avatar_url, role, department_id, designation, manager_id, joining_date, employment_status, default_work_mode, created_at, updated_at",
      )
      .eq("id", claims.sub)
      .maybeSingle()

    const employeeProfile = profile ? toEmployeeProfile(profile) : null

    return {
      userId: claims.sub,
      email:
        typeof claims.email === "string"
          ? claims.email
          : (employeeProfile?.email ?? null),
      role: employeeProfile?.role ?? null,
      profile: employeeProfile,
    }
  },
)

export async function requireUser(): Promise<AuthContext> {
  const context = await getCurrentAuthContext()

  if (!context) {
    redirect("/sign-in")
  }

  return context
}

export async function requireRole(
  allowedRoles: readonly UserRole[],
): Promise<AuthContext> {
  const context = await requireUser()

  if (!context.role || !allowedRoles.includes(context.role)) {
    redirect("/unauthorized")
  }

  return context
}

