# Dayflow database schema

Owner: Laptop 3 — workforce logic and data (L3-001).

Source of truth for column names/types is `src/types/database.ts`. This
document describes what the migration in
`supabase/migrations/20260822120000_init_schema.sql` actually creates.
Demo data is in `supabase/seed.sql` (see "Seed data" below). Nothing in
this document has been applied to a live Supabase project — there is no
`.env.local` / connected project in this repository at the time of
writing; the migration and seed have instead been validated against a
throwaway local Postgres instance (see "Verification" at the end).

## Enum types

| Enum | Values |
| --- | --- |
| `user_role` | `employee`, `hr`, `admin` |
| `employment_status` | `active`, `inactive`, `on_leave`, `terminated` |
| `work_mode` | `office`, `remote`, `hybrid` |
| `attendance_status` | `present`, `absent`, `partial`, `on_leave` |
| `leave_type` | `annual`, `sick`, `casual`, `unpaid`, `parental`, `bereavement`, `other` |
| `leave_status` | `pending`, `approved`, `rejected`, `cancelled` |
| `payroll_status` | `draft`, `published`, `paid` |
| `approval_entity_type` | `leave_request`, `attendance_adjustment`, `profile_change` |
| `approval_decision` | `approved`, `rejected` |

Each list is copied verbatim from the corresponding `as const` array in
`src/types/domain/*.ts`. If a domain file's literal union changes, the
enum here must change in the same PR (additive `ALTER TYPE ... ADD VALUE`
in a new migration; Postgres enums cannot easily remove values).

## Tables

### `departments`

| Column | Type | Constraints |
| --- | --- | --- |
| `id` | `uuid` | PK, default `gen_random_uuid()` |
| `name` | `text` | not null |
| `code` | `text` | not null, unique |
| `manager_id` | `uuid` | FK -> `profiles.id` on delete set null, nullable |
| `created_at` | `timestamptz` | not null, default `now()` |
| `updated_at` | `timestamptz` | not null, default `now()`, auto-updated by trigger |

Indexes: `departments_manager_id_idx (manager_id)`.

Note: `departments.manager_id` and `profiles.department_id` reference
each other, so the `departments_manager_id_fkey` foreign key is added
with `ALTER TABLE` after `profiles` is created, not inline on `CREATE
TABLE departments`.

### `profiles`

Extends `auth.users` (Supabase Auth owns identity per
`PROJECT_CONTEXT.md`). `id` is both the primary key and a foreign key to
`auth.users(id)`.

| Column | Type | Constraints |
| --- | --- | --- |
| `id` | `uuid` | PK, FK -> `auth.users.id` on delete cascade |
| `employee_code` | `text` | not null, unique |
| `email` | `text` | not null, unique |
| `full_name` | `text` | not null |
| `phone` | `text` | nullable |
| `avatar_url` | `text` | nullable |
| `role` | `user_role` | not null, default `employee` |
| `department_id` | `uuid` | FK -> `departments.id` on delete set null, nullable |
| `designation` | `text` | not null |
| `manager_id` | `uuid` | FK -> `profiles.id` on delete set null, nullable (self-reference) |
| `joining_date` | `date` | not null |
| `employment_status` | `employment_status` | not null, default `active` |
| `default_work_mode` | `work_mode` | not null, default `office` |
| `created_at` | `timestamptz` | not null, default `now()` |
| `updated_at` | `timestamptz` | not null, default `now()`, auto-updated by trigger |

Indexes: `profiles_department_id_idx`, `profiles_manager_id_idx`,
`profiles_role_idx`.

### `attendance_records`

| Column | Type | Constraints |
| --- | --- | --- |
| `id` | `uuid` | PK, default `gen_random_uuid()` |
| `employee_id` | `uuid` | not null, FK -> `profiles.id` on delete cascade |
| `work_date` | `date` | not null |
| `work_mode` | `work_mode` | not null |
| `check_in_at` | `timestamptz` | nullable |
| `check_out_at` | `timestamptz` | nullable |
| `worked_minutes` | `integer` | not null, default 0, check >= 0 |
| `status` | `attendance_status` | not null |
| `notes` | `text` | nullable |
| `location` | `jsonb` | nullable (matches `GeoPoint` domain shape) |
| `created_at` | `timestamptz` | not null, default `now()` |
| `updated_at` | `timestamptz` | not null, default `now()`, auto-updated by trigger |

Constraints:
- `unique (employee_id, work_date)` — one attendance row per employee per day.
- `check (worked_minutes >= 0)`.
- `check (check_in_at is null or check_out_at is null or check_out_at >= check_in_at)`.

Indexes: `attendance_records_employee_id_idx`,
`attendance_records_work_date_idx`, and a composite
`attendance_records_employee_work_date_idx (employee_id, work_date)` for
the "an employee's attendance in a date range" query shape from
`getAttendance` in API_CONTRACT.md.

### `leave_requests`

| Column | Type | Constraints |
| --- | --- | --- |
| `id` | `uuid` | PK, default `gen_random_uuid()` |
| `employee_id` | `uuid` | not null, FK -> `profiles.id` on delete cascade |
| `leave_type` | `leave_type` | not null |
| `start_date` | `date` | not null |
| `end_date` | `date` | not null |
| `day_count` | `numeric(5,1)` | not null, check > 0 |
| `reason` | `text` | not null |
| `status` | `leave_status` | not null, default `pending` |
| `reviewed_by` | `uuid` | FK -> `profiles.id` on delete set null, nullable |
| `reviewed_at` | `timestamptz` | nullable |
| `review_note` | `text` | nullable |
| `created_at` | `timestamptz` | not null, default `now()` |
| `updated_at` | `timestamptz` | not null, default `now()`, auto-updated by trigger |

Constraints:
- `check (end_date >= start_date)`.
- `check (day_count > 0)`.

`day_count` is `numeric(5,1)` rather than `integer` to allow half-day
leave in the future; nothing in the current domain type forbids a
fractional value and the UI can still round-display whole days.

Indexes: `leave_requests_employee_id_idx`, `leave_requests_start_date_idx`,
`leave_requests_end_date_idx`, `leave_requests_status_idx`, and a
composite `leave_requests_employee_status_idx (employee_id, status)` for
the common "my pending leave" query.

### `payroll_records`

| Column | Type | Constraints |
| --- | --- | --- |
| `id` | `uuid` | PK, default `gen_random_uuid()` |
| `employee_id` | `uuid` | not null, FK -> `profiles.id` on delete cascade |
| `period_start` | `date` | not null |
| `period_end` | `date` | not null |
| `gross_pay_minor` | `bigint` | not null, check >= 0 |
| `deductions_minor` | `bigint` | not null, default 0, check >= 0 |
| `net_pay_minor` | `bigint` | not null |
| `currency` | `text` | not null, default `INR` |
| `status` | `payroll_status` | not null, default `draft` |
| `payslip_url` | `text` | nullable |
| `paid_at` | `timestamptz` | nullable |
| `created_at` | `timestamptz` | not null, default `now()` |
| `updated_at` | `timestamptz` | not null, default `now()`, auto-updated by trigger |

Constraints:
- `check (period_end >= period_start)`.
- `check (gross_pay_minor >= 0 and deductions_minor >= 0 and net_pay_minor = gross_pay_minor - deductions_minor)` —
  kept, not skipped: it is a straightforward arithmetic identity and every
  seed row satisfies it. If future payroll logic needs pay components that
  don't net out exactly this way (bonuses, reimbursements paid outside
  this identity), relax this constraint in a follow-up migration.
- `unique (employee_id, period_start, period_end)` — one payroll record
  per employee per pay period.

Money is stored as integer minor units (`bigint`) per API_CONTRACT.md
("Money is stored as integer minor units plus currency"). `bigint`
rather than `integer` is a deliberate margin above the ~21.4M unit
(`int4`) ceiling for pay figures, at negligible cost.

Indexes: `payroll_records_employee_id_idx`,
`payroll_records_period_start_idx`, and a composite
`payroll_records_employee_period_start_idx (employee_id, period_start)`.

### `approval_actions`

Append-only audit log; no `updated_at` (matches `ApprovalActionRow` in
`src/types/database.ts`, which has no `updatedAt`/`updated_at` field).

| Column | Type | Constraints |
| --- | --- | --- |
| `id` | `uuid` | PK, default `gen_random_uuid()` |
| `entity_type` | `approval_entity_type` | not null |
| `entity_id` | `uuid` | not null (polymorphic — points at a row in whichever table `entity_type` names; no FK, see below) |
| `actor_id` | `uuid` | not null, FK -> `profiles.id` on delete cascade |
| `decision` | `approval_decision` | not null |
| `comment` | `text` | nullable |
| `created_at` | `timestamptz` | not null, default `now()` |

`entity_id` has no foreign key because it is polymorphic across
`leave_requests` and (in the future) attendance-adjustment and
profile-change tables that do not exist yet. Referential integrity for
`entity_id` is the caller's responsibility (Laptop 3's leave workflow
server actions in `src/features/workforce`).

Indexes: `approval_actions_entity_idx (entity_type, entity_id)`,
`approval_actions_actor_id_idx (actor_id)`.

## Triggers

| Trigger | Table | Fires | Function |
| --- | --- | --- | --- |
| `departments_set_updated_at` | `departments` | before update | `set_updated_at()` |
| `profiles_set_updated_at` | `profiles` | before update | `set_updated_at()` |
| `attendance_records_set_updated_at` | `attendance_records` | before update | `set_updated_at()` |
| `leave_requests_set_updated_at` | `leave_requests` | before update | `set_updated_at()` |
| `payroll_records_set_updated_at` | `payroll_records` | before update | `set_updated_at()` |
| `profiles_protect_privileged_fields` | `profiles` | before update | `protect_profile_privileged_fields()` |

`set_updated_at()` is a standard `new.updated_at = now(); return new;`
trigger function shared by every table that has an `updated_at` column.
`approval_actions` has no such trigger because it has no `updated_at`
column (append-only).

`protect_profile_privileged_fields()` is described under "Field-level
restriction on `profiles`" below.

## Helper function: `is_hr_or_admin()`

```sql
create or replace function public.is_hr_or_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('hr', 'admin')
  );
$$;
```

Every policy that needs an "is this caller HR or admin" check calls this
function instead of repeating the subquery. It is `security definer` and
owned by the migration role so that its internal `select ... from
profiles` runs as the table owner — which bypasses RLS by default
(`FORCE ROW LEVEL SECURITY` is not set on `profiles`) — instead of
re-entering the `profiles` SELECT policies and recursing. This is the
standard Supabase-documented pattern for role-check helper functions.

## Row Level Security model

RLS is enabled on every table. There is no `anon` access anywhere — every
policy is scoped `to authenticated`, and no table grants are given to
`anon`, so unauthenticated requests are rejected outright rather than
silently returning zero rows.

Table-level `GRANT`s (`select`/`insert`/`update` on the relevant tables,
to `authenticated`) are included explicitly in the migration. A hosted
Supabase project applies default grants for `anon`/`authenticated`
automatically, but the migration does not rely on that implicit platform
behavior — it grants the privileges itself so the schema is correct on
any plain Postgres instance too. Without a table-level grant, RLS
policies never even get evaluated: Postgres rejects the statement with
"permission denied for table ..." first. This was caught during local
verification (see "Verification").

| Table | Select | Insert | Update |
| --- | --- | --- | --- |
| `departments` | any authenticated user, all rows | hr/admin only | hr/admin only |
| `profiles` | own row, or all rows if hr/admin | none (see note) | own row (all columns pass RLS; non-privileged columns enforced by trigger, see below), or any row if hr/admin |
| `attendance_records` | own rows (`employee_id = auth.uid()`), or all rows if hr/admin | own rows only (`employee_id = auth.uid()`) | own rows only (`employee_id = auth.uid()`) |
| `leave_requests` | own rows, or all rows if hr/admin | own rows only | own row while `status = 'pending'` (row-level only, see note), or any row if hr/admin |
| `payroll_records` | own rows only, or all rows if hr/admin | hr/admin only | hr/admin only |
| `approval_actions` | hr/admin, or rows where `entity_type = 'leave_request'` and the caller owns that leave request | hr/admin only | none (append-only) |

Notes:

- **`profiles` has no INSERT policy.** New profile rows are created by
  the server-side provisioning flow immediately after Supabase Auth
  creates the `auth.users` row (a service-role client, which bypasses
  RLS entirely), not by the browser. If a self-serve "complete your
  profile" flow is ever added, it needs its own INSERT policy scoped to
  `id = auth.uid()`.
- **Field-level restriction on `profiles`.** The `profiles_update_own`
  policy is row-level only — Postgres RLS cannot express "this role may
  update column A but not column B" directly in a `USING`/`WITH CHECK`
  clause. To actually stop an employee from setting their own `role` or
  `department_id` in the same statement that legitimately updates
  `phone`/`avatar_url`, the migration adds a `before update` trigger,
  `protect_profile_privileged_fields()`, that raises an exception if any
  non-hr/admin caller changes any column other than `phone` or
  `avatar_url`. This is defense-in-depth at the database layer, but it is
  **not a substitute for input validation in the Server Action /
  repository layer** — the app layer (Laptop 3's `src/features/workforce`
  and Laptop 1's `src/features/auth`) should still only ever construct an
  update payload containing the fields it intends to change.
- **`leave_requests` self-update is also row-level only.** The
  `leave_requests_update_own_pending` policy lets an employee update
  their own row only while the *current* `status` is `pending`, but
  nothing in the database stops that update from setting `status` to
  something other than `cancelled` (e.g. `approved`). The intended use
  (cancel a pending request) should be enforced in the `cancelLeaveRequest`
  server action by only ever writing `status = 'cancelled'`, analogous to
  the profile field-level note above. A reviewer who wants a DB-level
  guarantee here should add a mirror of
  `protect_profile_privileged_fields()` scoped to this table.
- **`approval_actions` employee visibility is simplified.** The task only
  asked for "if feasible" — it is feasible for `entity_type =
  'leave_request'` because `leave_requests.employee_id` lets the policy
  join back to the caller. There is no `attendance_adjustment` or
  `profile_change` table yet, so those two entity types are visible to
  hr/admin only for now; an employee's `approval_actions` query will
  simply not see any adjustment/change rows tied to them until those
  tables exist and this policy is extended to match.
- **`attendance_records` has no hr/admin INSERT/UPDATE policy.** The task
  only specified employee-own INSERT/UPDATE and hr/admin SELECT-all, so
  that is exactly what's implemented. HR cannot currently correct another
  employee's attendance record through RLS; if that turns out to be
  needed (e.g. a manual correction workflow), add
  `attendance_update_hr_admin`/`attendance_insert_hr_admin` policies
  mirroring the `payroll_records` hr/admin policies.

## Seed data (`supabase/seed.sql`)

Self-contained SQL `INSERT`/`UPDATE` statements — no Supabase CLI or
network access required to read or apply the file. It has **not** been
run against a live project in this session (none is connected — no
`.env.local`). It was validated against a throwaway local Postgres
instance (see "Verification").

Contents:
- 3 departments: Engineering, People Operations, Sales & Marketing.
- 10 profiles: 1 admin, 2 hr, 7 employee; work modes mixed across
  office/remote/hybrid; one profile (`Devika Shah`) is `on_leave` to
  exercise that employment status.
- 25 `attendance_records` rows: one Mon–Fri work week (2026-08-17 to
  2026-08-21) across 5 employees, including a `partial` day, an `absent`
  day, and an `on_leave` day that lines up with one of the seeded leave
  requests.
- 6 `leave_requests`: 2 `pending`, 3 `approved`, 1 `rejected`, spanning
  several leave types (including a `parental` leave that is already
  in-progress relative to the seed's "today").
- 4 `approval_actions` rows, one per decided (`approved`/`rejected`)
  leave request, actioned by one of the two hr profiles.
- 30 `payroll_records`: 3 monthly periods (June, July, August 2026) per
  employee, mixing `paid`, `published`, and `draft` status, all
  satisfying the `net_pay_minor = gross_pay_minor - deductions_minor`
  check constraint.

**`auth.users` / `auth.identities` rows.** `profiles.id` is a foreign key
to `auth.users(id)`, so the seed also inserts 10 matching `auth.users`
rows (and corresponding `auth.identities` rows) using a minimal, broadly
stable GoTrue column set, with the password `Passw0rd!` for every seeded
account (hashed via `pgcrypto`'s `crypt()`/`gen_salt('bf')`). This is the
standard pattern for Supabase local-dev seed files and is what
`supabase db reset` runs automatically once a local Supabase project's
full auth schema exists. `auth.users`/`auth.identities` columns have
changed across GoTrue versions; if an insert fails against a
newer/older project's auth schema, either drop the offending columns or
skip the `auth.*` blocks and create the 10 accounts through Supabase Auth
sign-up (updating the fixed UUIDs used throughout the rest of the file to
match whatever Auth assigns) before running the `public.*` inserts.

`departments.manager_id` is left `null` in the initial `INSERT` and
backfilled with two `UPDATE` statements after `profiles` is inserted,
because `departments.manager_id -> profiles.id` and `profiles.department_id
-> departments.id` are a circular reference that no single insert order
can satisfy.

## Verification

No live Supabase project is connected this session. To still validate
the SQL, both files were run against a throwaway local Postgres 18
cluster (via `initdb`/`pg_ctl`, discarded after the run) with a hand-built
stand-in `auth.users`/`auth.identities` schema and `authenticated`/`anon`
roles approximating Supabase's platform setup:

- The migration applies cleanly end to end (enums, tables, FKs,
  constraints, indexes, triggers, helper function, grants, and every RLS
  policy).
- The seed file applies cleanly end to end and produces the row counts
  described above; all `CHECK` constraints (including the payroll
  `net_pay_minor` identity, `leave_requests` date range, and
  `attendance_records` unique per employee/day) passed on real data.
- With `SET ROLE authenticated` and a stand-in `auth.uid()` reading from
  a session GUC: an employee (Rohan Iyer) saw only his own 5 attendance
  rows, 3 payroll rows, 1 profile row, and 1 leave request, but all 3
  departments; an hr profile (Karan Mehta) saw all rows in every table;
  an employee's attempt to `INSERT` an attendance row for a different
  `employee_id` was rejected by RLS; an employee's attempt to `UPDATE`
  their own `role` to `admin` was rejected by the
  `protect_profile_privileged_fields()` trigger while updating their own
  `phone` succeeded; and an employee (Sanjana Pillai) querying
  `approval_actions` saw exactly the one row tied to her own leave
  request, not the other three.
- This exercise also caught a real gap: without an explicit table-level
  `GRANT` to `authenticated`, every query failed with "permission denied
  for table ..." regardless of the RLS policies, because Postgres checks
  table privileges before RLS is even evaluated. The migration now
  grants `select`/`insert`/`update` (as appropriate per table) to
  `authenticated` explicitly rather than relying on Supabase's default
  platform grants.

None of this constitutes running against the real Dayflow Supabase
project — a reviewer should still run
`supabase db reset` (or equivalent) against an actual Supabase-provisioned
Postgres before trusting this schema in production, since the hand-built
stand-in `auth` schema and roles used here are only an approximation of
Supabase's real GoTrue schema and default grants.

## Assumptions for a reviewer to double check

- **Money precision/currency.** `gross_pay_minor`/`deductions_minor`/
  `net_pay_minor` are `bigint`; `currency` defaults to `INR` with no
  `CHECK` restricting it to a specific ISO 4217 list (the domain type is
  just `CurrencyCode = string`). If the product should support only a
  fixed currency set, add a `CHECK (currency = 'INR')` or a small lookup
  table.
- **`day_count` is `numeric(5,1)`,** not `integer`, to leave room for
  half-day leave. If half-days are never allowed, tighten this to
  `integer` in a follow-up migration.
- **The `net_pay_minor = gross_pay_minor - deductions_minor` constraint
  was kept, not relaxed,** because it held for all seed data and is a
  simple, useful sanity check. Revisit if payroll gains line items that
  don't net out this way.
- **`attendance_records`/`leave_requests` self-update policies are
  row-level only**, as detailed above — cancel/self-service semantics
  beyond "which row" are enforced in the Server Action layer, not the
  database, except for `profiles` where a trigger adds a DB-level
  backstop.
- **`approval_actions.entity_id` has no foreign key** (polymorphic
  reference); integrity across `entity_type`/`entity_id` is the calling
  code's responsibility.
- **Seed currency, salary figures, names, and dates are illustrative**
  demo values, not sourced from any real payroll data.
- **The migration and seed were validated against a hand-built stand-in
  `auth` schema on plain local Postgres, not a real Supabase project**
  (none is connected in this repository/session) — re-run against an
  actual Supabase-provisioned database before relying on this in
  production.
