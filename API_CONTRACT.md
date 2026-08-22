# Dayflow API contract

Contract version: 0.1.0
Status: Foundation contract. Auth entries are implemented; workforce entries
are reserved interfaces for Laptop 3 and must remain compatible with shared
types.

## Transport rules

- Internal reads run in Server Components or server-only repositories. Do not
  call an internal Route Handler from a Server Component.
- UI mutations use Server Actions. Every action validates input and repeats
  authentication and authorization checks at the action boundary.
- Route Handlers are public HTTP surfaces and must return the shared API result
  shape, validate untrusted input, and enforce authorization independently.
- Success and failure values use ActionResult or ApiResponse from src/types/api.ts.
- IDs are UUID strings. Calendar dates are YYYY-MM-DD strings. Timestamps are
  ISO-8601 UTC strings. Money is stored as integer minor units plus currency.
- Never return an unrestricted Supabase row to the browser. Map database rows
  to domain DTOs and select only required columns.

## Standard result shape

A successful operation is an object with ok true and a data property. A failed
operation is an object with ok false and an error object containing code,
message, and optional fieldErrors. Allowed error codes are invalid_input,
unauthenticated, forbidden, not_found, conflict, rate_limited, and internal_error.

Do not expose raw Supabase errors, SQL details, stack traces, access tokens, or
personally sensitive data in error messages.

## Implemented auth contract — Laptop 1

| Export or route | Input | Output | Notes |
| --- | --- | --- | --- |
| signIn | previous SignInActionState, FormData with email, password, optional next | Promise of SignInActionState or redirect | Generic invalid-credential message |
| signOut | none | redirect to /sign-in | Clears Supabase session when configured |
| getCurrentAuthContext | none | AuthContext or null | Cached per render; secure claims verification |
| requireUser | none | AuthContext or redirect | Secure server-side guard |
| requireRole | array of UserRole | AuthContext or redirect | Checks profile role close to data use |
| GET /auth/callback | code and optional next query | redirect | Exchanges Supabase PKCE code; no JSON body |

The proxy refreshes Supabase cookies and performs only optimistic route checks.
Protected prefixes are /employee, /admin, and /dashboard. Feature code must
still call requireUser or requireRole and rely on RLS for database access.

## Reserved workforce action contract — Laptop 3

These operations are not implemented in the foundation. Keep names and shared
input/output models unless an approved contract change is documented.

| Operation | Input type | Success data | Primary consumers |
| --- | --- | --- | --- |
| checkIn | AttendanceCheckInInput | AttendanceRecord | Laptop 2 |
| checkOut | AttendanceCheckOutInput | AttendanceRecord | Laptop 2 |
| getAttendance | employee ID plus DateRange | AttendanceRecord array | Laptops 2 and 4 |
| submitLeaveRequest | LeaveRequestCreateInput | LeaveRequest | Laptop 2 |
| cancelLeaveRequest | LeaveRequest ID | LeaveRequest | Laptop 2 |
| reviewLeaveRequest | LeaveDecisionInput | LeaveRequest | Laptop 4 |
| getPayrollSummaries | employee ID plus optional DateRange | PayrollSummary array | Laptops 2 and 4 |
| getLeaveRequests | scope object with optional employeeId and status | LeaveRequest array | Laptops 2 and 4 |
| upsertPayrollRecord | employeeId, periodStart, periodEnd, grossPayMinor, deductionsMinor, currency, optional status | PayrollSummary | Laptop 4 |

Laptop 3 decides repository internals, transaction boundaries, and server action
file layout inside src/features/workforce. It must not return service-role clients
or privileged database rows to UI modules.

getLeaveRequests is an internal read (src/features/workforce/leave/queries.ts,
no Route Handler) added additively during implementation: self scope is allowed
for any authenticated user, all-employees or another employee's scope requires
hr/admin, enforced with requireUser/requireRole. upsertPayrollRecord
(src/features/workforce/payroll/actions.ts) is hr/admin only, computes
netPayMinor server-side, and satisfies the spec's "admin can update salary
structure" requirement that the original reserved table under-specified.

## Reserved admin and analytics read contract — Laptop 4

Analytics use AnalyticsQuery and return WorkforceSnapshot or chart-ready arrays
whose values are serializable primitives. Aggregation reads must be scoped to an
HR or admin user and backed by RLS or a reviewed security-definer function.
Recharts configuration belongs in the admin feature and does not change the
underlying metric definitions.

## Contract change protocol

1. Describe the proposed additive or breaking change in the owning laptop's
   TASK_BOARD.md section before implementation.
2. Obtain Laptop 1 integration agreement.
3. Update shared TypeScript types and this document in the same commit.
4. If persistence changes, also update DATABASE_SCHEMA.md and migrations.
5. Add a CHANGELOG.md entry and provide migration or compatibility notes.
