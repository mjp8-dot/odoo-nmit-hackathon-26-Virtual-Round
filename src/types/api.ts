export const API_ERROR_CODES = [
  "invalid_input",
  "unauthenticated",
  "forbidden",
  "not_found",
  "conflict",
  "rate_limited",
  "internal_error",
] as const

export type ApiErrorCode = (typeof API_ERROR_CODES)[number]

export interface ApiError {
  code: ApiErrorCode
  message: string
  fieldErrors?: Record<string, string[]>
}

export type ActionResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: ApiError }

export type ApiResponse<T> = ActionResult<T>

export interface PaginationInput {
  page?: number
  pageSize?: number
}

export interface PaginatedResult<T> {
  items: T[]
  page: number
  pageSize: number
  total: number
  hasNextPage: boolean
}

