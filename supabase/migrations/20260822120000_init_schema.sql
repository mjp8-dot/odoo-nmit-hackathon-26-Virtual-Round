-- Dayflow initial schema
-- Owner: Laptop 3 — workforce logic and data (L3-001)
--
-- Creates enum types, core tables, constraints, indexes, updated_at
-- triggers, helper functions, and Row Level Security policies for the
-- Dayflow HRMS. Forward-only migration; do not edit after it has been
-- applied to a shared environment — add a new migration instead.

-- ---------------------------------------------------------------------
-- Extensions
-- ---------------------------------------------------------------------

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------
-- Enum types (must match string literal unions in src/types/domain/*.ts)
-- ---------------------------------------------------------------------

create type public.user_role as enum ('employee', 'hr', 'admin');

create type public.employment_status as enum (
  'active',
  'inactive',
  'on_leave',
  'terminated'
);

create type public.work_mode as enum ('office', 'remote', 'hybrid');

create type public.attendance_status as enum (
  'present',
  'absent',
  'partial',
  'on_leave'
);

create type public.leave_type as enum (
  'annual',
  'sick',
  'casual',
  'unpaid',
  'parental',
  'bereavement',
  'other'
);

create type public.leave_status as enum (
  'pending',
  'approved',
  'rejected',
  'cancelled'
);

create type public.payroll_status as enum ('draft', 'published', 'paid');

create type public.approval_entity_type as enum (
  'leave_request',
  'attendance_adjustment',
  'profile_change'
);

create type public.approval_decision as enum ('approved', 'rejected');

-- ---------------------------------------------------------------------
-- updated_at trigger function (shared by every table with updated_at)
-- ---------------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------

-- departments.manager_id -> profiles.id is added after profiles exists
-- (circular reference between departments and profiles).
create table public.departments (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  code text not null,
  manager_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint departments_code_key unique (code)
);

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  employee_code text not null,
  email text not null,
  full_name text not null,
  phone text,
  avatar_url text,
  role public.user_role not null default 'employee',
  department_id uuid references public.departments (id) on delete set null,
  designation text not null,
  manager_id uuid references public.profiles (id) on delete set null,
  joining_date date not null,
  employment_status public.employment_status not null default 'active',
  default_work_mode public.work_mode not null default 'office',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_employee_code_key unique (employee_code),
  constraint profiles_email_key unique (email)
);

alter table public.departments
  add constraint departments_manager_id_fkey
  foreign key (manager_id) references public.profiles (id) on delete set null;

create table public.attendance_records (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.profiles (id) on delete cascade,
  work_date date not null,
  work_mode public.work_mode not null,
  check_in_at timestamptz,
  check_out_at timestamptz,
  worked_minutes integer not null default 0,
  status public.attendance_status not null,
  notes text,
  location jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint attendance_records_employee_work_date_key
    unique (employee_id, work_date),
  constraint attendance_records_worked_minutes_check
    check (worked_minutes >= 0),
  constraint attendance_records_check_out_after_check_in
    check (
      check_in_at is null
      or check_out_at is null
      or check_out_at >= check_in_at
    )
);

create table public.leave_requests (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.profiles (id) on delete cascade,
  leave_type public.leave_type not null,
  start_date date not null,
  end_date date not null,
  day_count numeric(5, 1) not null,
  reason text not null,
  status public.leave_status not null default 'pending',
  reviewed_by uuid references public.profiles (id) on delete set null,
  reviewed_at timestamptz,
  review_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint leave_requests_date_range_check check (end_date >= start_date),
  constraint leave_requests_day_count_check check (day_count > 0)
);

create table public.payroll_records (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.profiles (id) on delete cascade,
  period_start date not null,
  period_end date not null,
  gross_pay_minor bigint not null,
  deductions_minor bigint not null default 0,
  net_pay_minor bigint not null,
  currency text not null default 'INR',
  status public.payroll_status not null default 'draft',
  payslip_url text,
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint payroll_records_period_range_check check (period_end >= period_start),
  constraint payroll_records_amounts_check check (
    gross_pay_minor >= 0
    and deductions_minor >= 0
    and net_pay_minor = gross_pay_minor - deductions_minor
  ),
  constraint payroll_records_employee_period_key
    unique (employee_id, period_start, period_end)
);

create table public.approval_actions (
  id uuid primary key default gen_random_uuid(),
  entity_type public.approval_entity_type not null,
  entity_id uuid not null,
  actor_id uuid not null references public.profiles (id) on delete cascade,
  decision public.approval_decision not null,
  comment text,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------

create index departments_manager_id_idx on public.departments (manager_id);

create index profiles_department_id_idx on public.profiles (department_id);
create index profiles_manager_id_idx on public.profiles (manager_id);
create index profiles_role_idx on public.profiles (role);

create index attendance_records_employee_id_idx
  on public.attendance_records (employee_id);
create index attendance_records_work_date_idx
  on public.attendance_records (work_date);
create index attendance_records_employee_work_date_idx
  on public.attendance_records (employee_id, work_date);

create index leave_requests_employee_id_idx
  on public.leave_requests (employee_id);
create index leave_requests_start_date_idx
  on public.leave_requests (start_date);
create index leave_requests_end_date_idx
  on public.leave_requests (end_date);
create index leave_requests_status_idx
  on public.leave_requests (status);
create index leave_requests_employee_status_idx
  on public.leave_requests (employee_id, status);

create index payroll_records_employee_id_idx
  on public.payroll_records (employee_id);
create index payroll_records_period_start_idx
  on public.payroll_records (period_start);
create index payroll_records_employee_period_start_idx
  on public.payroll_records (employee_id, period_start);

create index approval_actions_entity_idx
  on public.approval_actions (entity_type, entity_id);
create index approval_actions_actor_id_idx
  on public.approval_actions (actor_id);

-- ---------------------------------------------------------------------
-- updated_at triggers
-- ---------------------------------------------------------------------

create trigger departments_set_updated_at
  before update on public.departments
  for each row execute function public.set_updated_at();

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

create trigger attendance_records_set_updated_at
  before update on public.attendance_records
  for each row execute function public.set_updated_at();

create trigger leave_requests_set_updated_at
  before update on public.leave_requests
  for each row execute function public.set_updated_at();

create trigger payroll_records_set_updated_at
  before update on public.payroll_records
  for each row execute function public.set_updated_at();

-- approval_actions has no updated_at column (append-only audit log).

-- ---------------------------------------------------------------------
-- RLS helper function
-- ---------------------------------------------------------------------
--
-- security definer + owned by the migration role lets this function read
-- public.profiles without re-entering the profiles RLS policies (the table
-- owner bypasses RLS by default because FORCE ROW LEVEL SECURITY is not
-- set). This avoids infinite recursion between the helper and the
-- profiles policies that call it, and keeps every other policy from
-- repeating the same "select role from profiles" subquery.

create or replace function public.is_hr_or_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role in ('hr', 'admin')
  );
$$;

-- ---------------------------------------------------------------------
-- profiles: defense-in-depth trigger for field-level self-update limits
-- ---------------------------------------------------------------------
--
-- RLS is row-level only: a USING/WITH CHECK policy cannot by itself stop
-- an employee from updating their own row's role or department_id in the
-- same statement that legitimately updates phone/avatar_url. This trigger
-- blocks that at the database layer for anyone who is not hr/admin. It is
-- a safety net, not a replacement for input validation in the Server
-- Action / repository layer — see DATABASE_SCHEMA.md.

create or replace function public.protect_profile_privileged_fields()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if public.is_hr_or_admin() then
    return new;
  end if;

  if new.role is distinct from old.role
    or new.employee_code is distinct from old.employee_code
    or new.email is distinct from old.email
    or new.full_name is distinct from old.full_name
    or new.department_id is distinct from old.department_id
    or new.designation is distinct from old.designation
    or new.manager_id is distinct from old.manager_id
    or new.joining_date is distinct from old.joining_date
    or new.employment_status is distinct from old.employment_status
    or new.default_work_mode is distinct from old.default_work_mode
  then
    raise exception 'employees may only update phone and avatar_url on their own profile';
  end if;

  return new;
end;
$$;

create trigger profiles_protect_privileged_fields
  before update on public.profiles
  for each row execute function public.protect_profile_privileged_fields();

-- ---------------------------------------------------------------------
-- Table-level grants
-- ---------------------------------------------------------------------
--
-- Row Level Security policies restrict *which rows* a statement can see
-- or touch, but Postgres still requires an ordinary table-level GRANT
-- before a role may run that statement at all. A hosted Supabase project
-- applies default grants for the authenticated/anon roles automatically,
-- but this migration grants them explicitly so the schema is correct on
-- any plain Postgres instance and does not silently depend on platform
-- bootstrap behavior. No table grants are given to anon: every policy
-- above is scoped "to authenticated", so unauthenticated requests should
-- be rejected outright rather than fall through to an empty result set.

grant usage on schema public to authenticated;

grant select, insert, update on public.departments to authenticated;
grant select, insert, update on public.profiles to authenticated;
grant select, insert, update on public.attendance_records to authenticated;
grant select, insert, update on public.leave_requests to authenticated;
grant select, insert, update on public.payroll_records to authenticated;
grant select, insert on public.approval_actions to authenticated;

-- ---------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------

alter table public.departments enable row level security;
alter table public.profiles enable row level security;
alter table public.attendance_records enable row level security;
alter table public.leave_requests enable row level security;
alter table public.payroll_records enable row level security;
alter table public.approval_actions enable row level security;

-- departments -----------------------------------------------------------

create policy departments_select_authenticated
  on public.departments
  for select
  to authenticated
  using (true);

create policy departments_insert_hr_admin
  on public.departments
  for insert
  to authenticated
  with check (public.is_hr_or_admin());

create policy departments_update_hr_admin
  on public.departments
  for update
  to authenticated
  using (public.is_hr_or_admin())
  with check (public.is_hr_or_admin());

-- profiles ----------------------------------------------------------------

create policy profiles_select_own
  on public.profiles
  for select
  to authenticated
  using (id = auth.uid());

create policy profiles_select_hr_admin
  on public.profiles
  for select
  to authenticated
  using (public.is_hr_or_admin());

create policy profiles_update_own
  on public.profiles
  for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

create policy profiles_update_hr_admin
  on public.profiles
  for update
  to authenticated
  using (public.is_hr_or_admin())
  with check (public.is_hr_or_admin());

-- No insert policy is defined for profiles: rows are created by the
-- auth callback / server-side provisioning flow using a service-role
-- client, which bypasses RLS. See DATABASE_SCHEMA.md.

-- attendance_records --------------------------------------------------

create policy attendance_select_own
  on public.attendance_records
  for select
  to authenticated
  using (employee_id = auth.uid());

create policy attendance_select_hr_admin
  on public.attendance_records
  for select
  to authenticated
  using (public.is_hr_or_admin());

create policy attendance_insert_own
  on public.attendance_records
  for insert
  to authenticated
  with check (employee_id = auth.uid());

create policy attendance_update_own
  on public.attendance_records
  for update
  to authenticated
  using (employee_id = auth.uid())
  with check (employee_id = auth.uid());

-- leave_requests --------------------------------------------------------

create policy leave_requests_select_own
  on public.leave_requests
  for select
  to authenticated
  using (employee_id = auth.uid());

create policy leave_requests_select_hr_admin
  on public.leave_requests
  for select
  to authenticated
  using (public.is_hr_or_admin());

create policy leave_requests_insert_own
  on public.leave_requests
  for insert
  to authenticated
  with check (employee_id = auth.uid());

create policy leave_requests_update_own_pending
  on public.leave_requests
  for update
  to authenticated
  using (employee_id = auth.uid() and status = 'pending')
  with check (employee_id = auth.uid());

create policy leave_requests_update_hr_admin
  on public.leave_requests
  for update
  to authenticated
  using (public.is_hr_or_admin())
  with check (public.is_hr_or_admin());

-- payroll_records -------------------------------------------------------

create policy payroll_select_own
  on public.payroll_records
  for select
  to authenticated
  using (employee_id = auth.uid());

create policy payroll_select_hr_admin
  on public.payroll_records
  for select
  to authenticated
  using (public.is_hr_or_admin());

create policy payroll_insert_hr_admin
  on public.payroll_records
  for insert
  to authenticated
  with check (public.is_hr_or_admin());

create policy payroll_update_hr_admin
  on public.payroll_records
  for update
  to authenticated
  using (public.is_hr_or_admin())
  with check (public.is_hr_or_admin());

-- approval_actions --------------------------------------------------------

create policy approval_actions_select_hr_admin_or_own_entity
  on public.approval_actions
  for select
  to authenticated
  using (
    public.is_hr_or_admin()
    or (
      entity_type = 'leave_request'
      and exists (
        select 1
        from public.leave_requests lr
        where lr.id = approval_actions.entity_id
          and lr.employee_id = auth.uid()
      )
    )
  );

create policy approval_actions_insert_hr_admin
  on public.approval_actions
  for insert
  to authenticated
  with check (public.is_hr_or_admin());
