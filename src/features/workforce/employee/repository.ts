import "server-only"

import { createServerSupabaseClient } from "@/lib/supabase/server"
import type { Department, EmployeeProfile, EmploymentStatus } from "@/types/domain"
import type { Tables } from "@/types/database"

const PROFILE_COLUMNS =
  "id, employee_code, email, full_name, phone, avatar_url, role, department_id, designation, manager_id, joining_date, employment_status, default_work_mode, created_at, updated_at"

const DEPARTMENT_COLUMNS = "id, name, code, manager_id, created_at, updated_at"

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

function toDepartment(row: Tables<"departments">): Department {
  return {
    id: row.id,
    name: row.name,
    code: row.code,
    managerId: row.manager_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

/**
 * Escapes characters that are meaningful to PostgREST's `ilike` pattern
 * syntax (`%`, `_`) and strips characters that would break out of the
 * `.or()` filter expression (`,`, `(`, `)`), since the search term is
 * embedded directly into a comma-separated filter string.
 */
function sanitizeSearchTerm(term: string): string {
  return term.trim().replace(/[,()]/g, "").replace(/[%_]/g, (match) => `\\${match}`)
}

export interface EmployeeListFilter {
  search?: string
  departmentId?: string
  status?: EmploymentStatus
}

export interface EmployeeListPage {
  page: number
  pageSize: number
}

export interface EmployeeListResult {
  items: EmployeeProfile[]
  total: number
}

export async function findEmployees(
  filter: EmployeeListFilter,
  pagination: EmployeeListPage,
): Promise<EmployeeListResult> {
  const supabase = await createServerSupabaseClient()
  const from = (pagination.page - 1) * pagination.pageSize
  const to = from + pagination.pageSize - 1

  let query = supabase
    .from("profiles")
    .select(PROFILE_COLUMNS, { count: "exact" })

  if (filter.departmentId) {
    query = query.eq("department_id", filter.departmentId)
  }

  if (filter.status) {
    query = query.eq("employment_status", filter.status)
  }

  const search = filter.search?.trim()
  if (search) {
    const term = sanitizeSearchTerm(search)
    query = query.or(
      `full_name.ilike.%${term}%,email.ilike.%${term}%,employee_code.ilike.%${term}%`,
    )
  }

  const { data, error, count } = await query
    .order("full_name", { ascending: true })
    .range(from, to)

  if (error) {
    throw error
  }

  return {
    items: (data ?? []).map(toEmployeeProfile),
    total: count ?? 0,
  }
}

export async function findEmployeeById(id: string): Promise<EmployeeProfile | null> {
  const supabase = await createServerSupabaseClient()
  const { data, error } = await supabase
    .from("profiles")
    .select(PROFILE_COLUMNS)
    .eq("id", id)
    .maybeSingle()

  if (error) {
    throw error
  }

  return data ? toEmployeeProfile(data) : null
}

export async function findDepartments(): Promise<Department[]> {
  const supabase = await createServerSupabaseClient()
  const { data, error } = await supabase
    .from("departments")
    .select(DEPARTMENT_COLUMNS)
    .order("name", { ascending: true })

  if (error) {
    throw error
  }

  return (data ?? []).map(toDepartment)
}
