# Changelog

Use one bullet per meaningful change in the matching laptop section. Entries are
append-only and use the format: YYYY-MM-DD — description (commit or PR when known).

## Unreleased

### Laptop 1 — Foundation and integration

- 2026-08-22 — Initialized the Dayflow Next.js, TypeScript, Tailwind, and
  shadcn/ui foundation.
- 2026-08-22 — Added modular team ownership, shared contracts, Supabase SSR/Auth
  plumbing, and secrets-optional build behavior.

### Laptop 2 — Employee experience

- No changes yet.

### Laptop 3 — Workforce logic and data

- 2026-08-22 — Added employee directory reads (getEmployees, getEmployeeById,
  listDepartments) and payroll reads/writes (getPayrollSummaries,
  upsertPayrollRecord) under src/features/workforce/employee and
  src/features/workforce/payroll, with repository row-to-DTO mapping, zod
  input validation, and server-side role/ownership authorization on every
  export.
- 2026-08-22 — Added leave request operations (submitLeaveRequest,
  cancelLeaveRequest, reviewLeaveRequest) and an internal getLeaveRequests
  read under src/features/workforce/leave, with repository row-to-DTO
  mapping, server-side day-count computation, zod input validation, and
  server-side ownership/role authorization and legal-state-transition
  enforcement on every export.
- 2026-08-22 — Added attendance check-in/check-out server actions (checkIn,
  checkOut) and an internal getAttendance read under
  src/features/workforce/attendance, with repository row-to-DTO mapping,
  zod input validation, server-determined work date/timestamps (clamped to
  never be in the future), server-computed worked_minutes and status,
  duplicate-check-in and double-checkout conflict handling, and
  ownership/role authorization on every export.
- 2026-08-22 — Added the initial database schema (L3-001): documented in
  DATABASE_SCHEMA.md and implemented in
  supabase/migrations/20260822120000_init_schema.sql — 9 Postgres enums
  matching src/types/domain exactly, the 6 tables from
  src/types/database.ts with matching FKs/constraints/indexes,
  updated_at triggers, an is_hr_or_admin() RLS helper, a
  protect_profile_privileged_fields() trigger as a DB-level backstop for
  self-service profile updates, explicit table grants, and Row Level
  Security policies on every table (own-row access for employees,
  hr/admin full access, department-scoped visibility for departments,
  and entity-owner visibility for approval_actions). Added
  supabase/seed.sql with 3 departments, 10 profiles across all three
  roles, a week of attendance, 6 leave requests in varying statuses, and
  3 payroll periods per employee. Migration and seed were syntax- and
  behavior-verified against a throwaway local Postgres instance (no live
  Supabase project is connected this session); see "Verification" in
  DATABASE_SCHEMA.md for what was and was not exercised.

### Laptop 4 — HR and analytics

- Built the admin leave-approval screen at /admin/leave
  (src/app/(admin)/admin/leave/page.tsx), replacing the placeholder stub.
  Adds src/features/admin-analytics/leave/leave-request-table.tsx (table with
  employee name, leave type, formatted date range, day count, reason, status
  badge, and — for pending rows — an inline Approve/Reject form with an
  optional review-note textarea; decided rows show reviewer name and note
  instead) and actions.ts (a "use server" FormData adapter,
  reviewLeaveRequestFormAction, that calls the existing reviewLeaveRequest
  Server Action from src/features/workforce/leave — no new authorization
  logic, requireRole(["hr", "admin"]) inside that action remains the real
  boundary; the review form needs no client component since a plain
  <form action={...}> submitting a Server Action already re-renders the page
  with fresh data on completion). The page defaults to a "pending" status
  filter (?status=all/pending/approved/rejected/cancelled) and builds an
  employeeId-to-name lookup from a single getEmployees({}, { pageSize: 100 })
  call to avoid N+1 lookups. No live Supabase project this session; verified
  via `npx tsc --noEmit` (clean for these files; pre-existing unrelated
  errors remain in src/app/(admin)/admin/attendance and
  src/features/admin-analytics/attendance, owned by a different laptop) and
  `npx eslint src/features/admin-analytics/leave "src/app/(admin)/admin/leave"
  --max-warnings=0` (clean).

- Built the admin attendance and payroll screens at /admin/attendance and
  /admin/payroll (src/app/(admin)/admin/attendance/page.tsx,
  src/app/(admin)/admin/payroll/page.tsx), replacing both placeholder stubs.
  Adds src/features/admin-analytics/attendance/today-attendance.ts (loads the
  roster via getEmployees, then Promise.all(getAttendance(...)) for a single
  ?date= day — there is no company-wide "all employees on date X" query in
  the workforce module; employees with no record for the date still appear
  as `record: null` instead of being dropped) and attendance-table.tsx (work
  mode, check-in/check-out formatted as local time, status badge, notes —
  only real AttendanceRecord fields, no invented verification/confidence
  data). Adds src/features/admin-analytics/payroll/payroll-table.tsx (loads
  the roster, then Promise.all(getPayrollSummaries(...)) and keeps the
  highest-periodEnd record per employee; renders gross/deductions/net via
  Intl.NumberFormat currency formatting, never raw minor-unit integers) and
  payroll-update-form.tsx (a client component per employee, always-visible
  rather than row-expand for simplicity, calling the existing
  upsertPayrollRecord Server Action from src/features/workforce/payroll — no
  new authorization logic, requireRole(["hr", "admin"]) inside that action
  remains the real boundary; client-side checks are UX-only guardrails, not
  a duplicate of the action's zod validation; router.refresh() after a
  successful save re-reads the roster so the saved record shows immediately).
  Both pages also call requireRole(["hr", "admin"]) directly for defense in
  depth alongside the (admin) layout's existing guard. No live Supabase
  project this session; verified via `npx tsc --noEmit` (clean) and
  `npx eslint src/features/admin-analytics/attendance
  src/features/admin-analytics/payroll "src/app/(admin)/admin/attendance"
  "src/app/(admin)/admin/payroll" --max-warnings=0` (clean).
