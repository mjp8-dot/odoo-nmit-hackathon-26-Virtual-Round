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

- No changes yet.
