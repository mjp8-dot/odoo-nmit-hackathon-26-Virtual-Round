import "server-only"

import { requireRole, requireUser } from "@/features/auth/dal"
import type { ActionResult, PaginatedResult, PaginationInput } from "@/types/api"
import type { Department, EmployeeProfile, EmploymentStatus } from "@/types/domain"

import { findDepartments, findEmployeeById, findEmployees } from "./repository"

const DEFAULT_PAGE_SIZE = 20
const MAX_PAGE_SIZE = 100

export interface EmployeeListFilter {
  search?: string
  departmentId?: string
  status?: EmploymentStatus
}

function normalizePagination(pagination: PaginationInput): {
  page: number
  pageSize: number
} {
  const page =
    pagination.page && Number.isFinite(pagination.page) && pagination.page > 0
      ? Math.floor(pagination.page)
      : 1

  const pageSize =
    pagination.pageSize &&
    Number.isFinite(pagination.pageSize) &&
    pagination.pageSize > 0
      ? Math.min(Math.floor(pagination.pageSize), MAX_PAGE_SIZE)
      : DEFAULT_PAGE_SIZE

  return { page, pageSize }
}

/**
 * Lists employees for HR/admin workforce management screens.
 *
 * Authorization: requireRole(["hr", "admin"]) — an ordinary employee can
 * never enumerate the workforce. requireRole redirects unauthenticated or
 * unauthorized callers, matching the existing auth guard contract.
 */
export async function getEmployees(
  filter: EmployeeListFilter,
  pagination: PaginationInput,
): Promise<ActionResult<PaginatedResult<EmployeeProfile>>> {
  await requireRole(["hr", "admin"])

  try {
    const { page, pageSize } = normalizePagination(pagination)
    const { items, total } = await findEmployees(filter, { page, pageSize })

    return {
      ok: true,
      data: {
        items,
        page,
        pageSize,
        total,
        hasNextPage: page * pageSize < total,
      },
    }
  } catch {
    return {
      ok: false,
      error: {
        code: "internal_error",
        message: "Unable to load employees right now.",
      },
    }
  }
}

/**
 * Fetches a single employee profile.
 *
 * Authorization: requireUser() then a per-resource check — allowed when the
 * caller is requesting their own profile OR the caller's role is hr/admin.
 * Any other caller gets a "forbidden" ActionResult (not a redirect), since
 * the decision depends on the requested resource, not just the caller's role.
 */
export async function getEmployeeById(
  id: string,
): Promise<ActionResult<EmployeeProfile>> {
  const context = await requireUser()

  const isSelf = context.userId === id
  const isPrivileged = context.role === "hr" || context.role === "admin"

  if (!isSelf && !isPrivileged) {
    return {
      ok: false,
      error: {
        code: "forbidden",
        message: "You are not allowed to view this employee.",
      },
    }
  }

  try {
    const employee = await findEmployeeById(id)

    if (!employee) {
      return {
        ok: false,
        error: { code: "not_found", message: "Employee not found." },
      }
    }

    return { ok: true, data: employee }
  } catch {
    return {
      ok: false,
      error: {
        code: "internal_error",
        message: "Unable to load this employee right now.",
      },
    }
  }
}

/**
 * Lists departments for filters and forms.
 *
 * Authorization: requireUser() only — any authenticated user may read the
 * department list, it carries no sensitive data.
 */
export async function listDepartments(): Promise<ActionResult<Department[]>> {
  await requireUser()

  try {
    const departments = await findDepartments()
    return { ok: true, data: departments }
  } catch {
    return {
      ok: false,
      error: {
        code: "internal_error",
        message: "Unable to load departments right now.",
      },
    }
  }
}
