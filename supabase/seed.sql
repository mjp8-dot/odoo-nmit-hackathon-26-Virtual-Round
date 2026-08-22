-- Dayflow demo seed data
-- Owner: Laptop 3 — workforce logic and data (L3-001)
--
-- Self-contained SQL insert statements. No Supabase CLI, service-role
-- client, or network access required to read this file — it is meant to
-- be run with a Postgres client (or `supabase db reset`, which applies
-- supabase/seed.sql automatically against a fresh local database that
-- already has the auth schema and the 20260822120000_init_schema.sql
-- migration applied) whenever the project is actually provisioned.
--
-- auth.users / auth.identities note: public.profiles.id is a foreign key
-- to auth.users(id) (Supabase Auth owns identity, see PROJECT_CONTEXT.md).
-- To keep this file runnable standalone, it inserts matching rows into
-- auth.users and auth.identities using a widely stable minimal column
-- set. auth.users/auth.identities columns have grown across Supabase
-- GoTrue versions; if an insert below fails against a newer or older
-- project, either drop columns that do not exist in that project's auth
-- schema, or skip the auth.* blocks entirely and create the 10 demo
-- accounts through Supabase Auth sign-up using these same fixed UUIDs
-- (or update the UUIDs below to match whatever Auth assigns) before
-- running the public.* inserts. Demo password for every seeded user is
-- 'Passw0rd!'.

begin;

-- ---------------------------------------------------------------------
-- auth.users / auth.identities (demo accounts)
-- ---------------------------------------------------------------------

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
  created_at, updated_at,
  confirmation_token, recovery_token, email_change_token_new, email_change
)
values
  ('00000000-0000-0000-0000-000000000000', '20000000-0000-0000-0000-000000000001', 'authenticated', 'authenticated', 'aditi.rao@dayflow.dev', crypt('Passw0rd!', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Aditi Rao"}', now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '20000000-0000-0000-0000-000000000002', 'authenticated', 'authenticated', 'karan.mehta@dayflow.dev', crypt('Passw0rd!', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Karan Mehta"}', now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '20000000-0000-0000-0000-000000000003', 'authenticated', 'authenticated', 'neha.verma@dayflow.dev', crypt('Passw0rd!', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Neha Verma"}', now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '20000000-0000-0000-0000-000000000004', 'authenticated', 'authenticated', 'rohan.iyer@dayflow.dev', crypt('Passw0rd!', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Rohan Iyer"}', now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '20000000-0000-0000-0000-000000000005', 'authenticated', 'authenticated', 'sanjana.pillai@dayflow.dev', crypt('Passw0rd!', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Sanjana Pillai"}', now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '20000000-0000-0000-0000-000000000006', 'authenticated', 'authenticated', 'vikram.nair@dayflow.dev', crypt('Passw0rd!', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Vikram Nair"}', now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '20000000-0000-0000-0000-000000000007', 'authenticated', 'authenticated', 'priya.menon@dayflow.dev', crypt('Passw0rd!', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Priya Menon"}', now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '20000000-0000-0000-0000-000000000008', 'authenticated', 'authenticated', 'arjun.kapoor@dayflow.dev', crypt('Passw0rd!', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Arjun Kapoor"}', now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '20000000-0000-0000-0000-000000000009', 'authenticated', 'authenticated', 'meera.joshi@dayflow.dev', crypt('Passw0rd!', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Meera Joshi"}', now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '20000000-0000-0000-0000-000000000010', 'authenticated', 'authenticated', 'devika.shah@dayflow.dev', crypt('Passw0rd!', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Devika Shah"}', now(), now(), '', '', '', '');

insert into auth.identities (
  provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at
)
select
  id::text,
  id,
  jsonb_build_object('sub', id::text, 'email', email),
  'email',
  now(),
  now(),
  now()
from auth.users
where id in (
  '20000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000002',
  '20000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000004',
  '20000000-0000-0000-0000-000000000005', '20000000-0000-0000-0000-000000000006',
  '20000000-0000-0000-0000-000000000007', '20000000-0000-0000-0000-000000000008',
  '20000000-0000-0000-0000-000000000009', '20000000-0000-0000-0000-000000000010'
);

-- ---------------------------------------------------------------------
-- departments
-- ---------------------------------------------------------------------
--
-- manager_id is left null here and backfilled after profiles are
-- inserted below: departments.manager_id references profiles(id) and
-- profiles.department_id references departments(id), so the two tables
-- have a circular dependency that a single insert order cannot satisfy.

insert into public.departments (id, name, code, manager_id) values
  ('10000000-0000-0000-0000-000000000001', 'Engineering', 'ENG', null),
  ('10000000-0000-0000-0000-000000000002', 'People Operations', 'PEO', null),
  ('10000000-0000-0000-0000-000000000003', 'Sales & Marketing', 'SAL', null);

-- ---------------------------------------------------------------------
-- profiles (8-10 employees, mixed roles / work modes)
-- ---------------------------------------------------------------------

insert into public.profiles (
  id, employee_code, email, full_name, phone, avatar_url, role,
  department_id, designation, manager_id, joining_date,
  employment_status, default_work_mode
) values
  ('20000000-0000-0000-0000-000000000001', 'EMP-0001', 'aditi.rao@dayflow.dev', 'Aditi Rao', '+91-9800000001', null, 'admin', '10000000-0000-0000-0000-000000000001', 'Engineering Director', null, '2022-03-01', 'active', 'office'),
  ('20000000-0000-0000-0000-000000000002', 'EMP-0002', 'karan.mehta@dayflow.dev', 'Karan Mehta', '+91-9800000002', null, 'hr', '10000000-0000-0000-0000-000000000002', 'HR Manager', null, '2022-05-15', 'active', 'hybrid'),
  ('20000000-0000-0000-0000-000000000003', 'EMP-0003', 'neha.verma@dayflow.dev', 'Neha Verma', '+91-9800000003', null, 'hr', '10000000-0000-0000-0000-000000000002', 'HR Business Partner', '20000000-0000-0000-0000-000000000002', '2023-01-10', 'active', 'office'),
  ('20000000-0000-0000-0000-000000000004', 'EMP-0004', 'rohan.iyer@dayflow.dev', 'Rohan Iyer', '+91-9800000004', null, 'employee', '10000000-0000-0000-0000-000000000001', 'Senior Software Engineer', '20000000-0000-0000-0000-000000000001', '2022-07-18', 'active', 'remote'),
  ('20000000-0000-0000-0000-000000000005', 'EMP-0005', 'sanjana.pillai@dayflow.dev', 'Sanjana Pillai', '+91-9800000005', null, 'employee', '10000000-0000-0000-0000-000000000001', 'Software Engineer', '20000000-0000-0000-0000-000000000001', '2023-02-20', 'active', 'hybrid'),
  ('20000000-0000-0000-0000-000000000006', 'EMP-0006', 'vikram.nair@dayflow.dev', 'Vikram Nair', '+91-9800000006', null, 'employee', '10000000-0000-0000-0000-000000000001', 'QA Engineer', '20000000-0000-0000-0000-000000000001', '2023-09-04', 'active', 'office'),
  ('20000000-0000-0000-0000-000000000007', 'EMP-0007', 'priya.menon@dayflow.dev', 'Priya Menon', '+91-9800000007', null, 'employee', '10000000-0000-0000-0000-000000000003', 'Account Executive', null, '2023-04-11', 'active', 'remote'),
  ('20000000-0000-0000-0000-000000000008', 'EMP-0008', 'arjun.kapoor@dayflow.dev', 'Arjun Kapoor', '+91-9800000008', null, 'employee', '10000000-0000-0000-0000-000000000003', 'Marketing Specialist', null, '2024-01-08', 'active', 'hybrid'),
  ('20000000-0000-0000-0000-000000000009', 'EMP-0009', 'meera.joshi@dayflow.dev', 'Meera Joshi', '+91-9800000009', null, 'employee', '10000000-0000-0000-0000-000000000001', 'Product Designer', '20000000-0000-0000-0000-000000000001', '2023-06-26', 'active', 'office'),
  ('20000000-0000-0000-0000-000000000010', 'EMP-0010', 'devika.shah@dayflow.dev', 'Devika Shah', '+91-9800000010', null, 'employee', '10000000-0000-0000-0000-000000000003', 'Content Strategist', null, '2024-03-15', 'on_leave', 'remote');

-- Backfill department heads now that the profile rows exist.
update public.departments set manager_id = '20000000-0000-0000-0000-000000000001' where id = '10000000-0000-0000-0000-000000000001';
update public.departments set manager_id = '20000000-0000-0000-0000-000000000002' where id = '10000000-0000-0000-0000-000000000002';

-- ---------------------------------------------------------------------
-- attendance_records — one work week (2026-08-17 to 2026-08-21) for a
-- handful of employees, matching each profile's default work mode
-- ---------------------------------------------------------------------

insert into public.attendance_records (
  employee_id, work_date, work_mode, check_in_at, check_out_at,
  worked_minutes, status, notes
) values
  -- Rohan Iyer (remote)
  ('20000000-0000-0000-0000-000000000004', '2026-08-17', 'remote', '2026-08-17T09:05:00Z', '2026-08-17T17:40:00Z', 515, 'present', null),
  ('20000000-0000-0000-0000-000000000004', '2026-08-18', 'remote', '2026-08-18T09:00:00Z', '2026-08-18T17:30:00Z', 510, 'present', null),
  ('20000000-0000-0000-0000-000000000004', '2026-08-19', 'remote', '2026-08-19T09:10:00Z', '2026-08-19T13:00:00Z', 230, 'partial', 'Left early for a dentist appointment'),
  ('20000000-0000-0000-0000-000000000004', '2026-08-20', 'remote', '2026-08-20T09:00:00Z', '2026-08-20T17:35:00Z', 515, 'present', null),
  ('20000000-0000-0000-0000-000000000004', '2026-08-21', 'remote', '2026-08-21T09:05:00Z', '2026-08-21T17:20:00Z', 495, 'present', null),

  -- Sanjana Pillai (hybrid)
  ('20000000-0000-0000-0000-000000000005', '2026-08-17', 'office', '2026-08-17T09:15:00Z', '2026-08-17T18:00:00Z', 525, 'present', null),
  ('20000000-0000-0000-0000-000000000005', '2026-08-18', 'remote', '2026-08-18T09:00:00Z', '2026-08-18T17:45:00Z', 525, 'present', null),
  ('20000000-0000-0000-0000-000000000005', '2026-08-19', 'office', '2026-08-19T09:10:00Z', '2026-08-19T17:50:00Z', 520, 'present', null),
  ('20000000-0000-0000-0000-000000000005', '2026-08-20', 'remote', null, null, 0, 'absent', 'Unplanned absence'),
  ('20000000-0000-0000-0000-000000000005', '2026-08-21', 'office', '2026-08-21T09:05:00Z', '2026-08-21T17:30:00Z', 505, 'present', null),

  -- Vikram Nair (office)
  ('20000000-0000-0000-0000-000000000006', '2026-08-17', 'office', '2026-08-17T09:00:00Z', '2026-08-17T17:30:00Z', 510, 'present', null),
  ('20000000-0000-0000-0000-000000000006', '2026-08-18', 'office', '2026-08-18T09:05:00Z', '2026-08-18T17:35:00Z', 510, 'present', null),
  ('20000000-0000-0000-0000-000000000006', '2026-08-19', 'office', '2026-08-19T09:00:00Z', '2026-08-19T17:30:00Z', 510, 'present', null),
  ('20000000-0000-0000-0000-000000000006', '2026-08-20', 'office', '2026-08-20T09:10:00Z', '2026-08-20T17:40:00Z', 510, 'present', null),
  ('20000000-0000-0000-0000-000000000006', '2026-08-21', 'office', '2026-08-21T09:00:00Z', '2026-08-21T14:00:00Z', 300, 'partial', 'Half day — personal errand'),

  -- Priya Menon (remote)
  ('20000000-0000-0000-0000-000000000007', '2026-08-17', 'remote', '2026-08-17T09:20:00Z', '2026-08-17T18:00:00Z', 520, 'present', null),
  ('20000000-0000-0000-0000-000000000007', '2026-08-18', 'remote', '2026-08-18T09:15:00Z', '2026-08-18T17:50:00Z', 515, 'present', null),
  ('20000000-0000-0000-0000-000000000007', '2026-08-19', 'remote', '2026-08-19T09:10:00Z', '2026-08-19T17:45:00Z', 515, 'present', null),
  ('20000000-0000-0000-0000-000000000007', '2026-08-20', 'remote', '2026-08-20T09:00:00Z', '2026-08-20T17:30:00Z', 510, 'present', null),
  ('20000000-0000-0000-0000-000000000007', '2026-08-21', 'remote', null, null, 0, 'on_leave', 'Approved casual leave'),

  -- Arjun Kapoor (hybrid)
  ('20000000-0000-0000-0000-000000000008', '2026-08-17', 'office', '2026-08-17T09:30:00Z', '2026-08-17T18:00:00Z', 510, 'present', null),
  ('20000000-0000-0000-0000-000000000008', '2026-08-18', 'remote', '2026-08-18T09:20:00Z', '2026-08-18T17:50:00Z', 510, 'present', null),
  ('20000000-0000-0000-0000-000000000008', '2026-08-19', 'office', '2026-08-19T09:15:00Z', '2026-08-19T17:40:00Z', 505, 'present', null),
  ('20000000-0000-0000-0000-000000000008', '2026-08-20', 'remote', '2026-08-20T09:10:00Z', '2026-08-20T17:30:00Z', 500, 'present', null),
  ('20000000-0000-0000-0000-000000000008', '2026-08-21', 'office', '2026-08-21T09:00:00Z', '2026-08-21T17:20:00Z', 500, 'present', null);

-- ---------------------------------------------------------------------
-- leave_requests (varying statuses)
-- ---------------------------------------------------------------------

insert into public.leave_requests (
  id, employee_id, leave_type, start_date, end_date, day_count, reason,
  status, reviewed_by, reviewed_at, review_note
) values
  ('30000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000004', 'annual', '2026-09-07', '2026-09-11', 5, 'Family trip', 'pending', null, null, null),
  ('30000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000005', 'sick', '2026-08-12', '2026-08-13', 2, 'Fever and flu', 'approved', '20000000-0000-0000-0000-000000000002', '2026-08-11T10:15:00Z', 'Get well soon'),
  ('30000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000007', 'casual', '2026-08-21', '2026-08-21', 1, 'Personal errand', 'approved', '20000000-0000-0000-0000-000000000003', '2026-08-19T08:30:00Z', 'Approved'),
  ('30000000-0000-0000-0000-000000000004', '20000000-0000-0000-0000-000000000008', 'unpaid', '2026-09-01', '2026-09-05', 5, 'Extended personal travel', 'rejected', '20000000-0000-0000-0000-000000000002', '2026-08-20T12:00:00Z', 'Coincides with campaign launch, please reschedule'),
  ('30000000-0000-0000-0000-000000000005', '20000000-0000-0000-0000-000000000009', 'annual', '2026-10-05', '2026-10-09', 5, 'Wedding in the family', 'pending', null, null, null),
  ('30000000-0000-0000-0000-000000000006', '20000000-0000-0000-0000-000000000010', 'parental', '2026-08-01', '2026-09-30', 45, 'Parental leave', 'approved', '20000000-0000-0000-0000-000000000002', '2026-07-20T09:00:00Z', 'Approved per policy');

-- ---------------------------------------------------------------------
-- approval_actions — audit trail for the decided leave requests above
-- ---------------------------------------------------------------------

insert into public.approval_actions (entity_type, entity_id, actor_id, decision, comment) values
  ('leave_request', '30000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000002', 'approved', 'Get well soon'),
  ('leave_request', '30000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000003', 'approved', 'Approved'),
  ('leave_request', '30000000-0000-0000-0000-000000000004', '20000000-0000-0000-0000-000000000002', 'rejected', 'Coincides with campaign launch, please reschedule'),
  ('leave_request', '30000000-0000-0000-0000-000000000006', '20000000-0000-0000-0000-000000000002', 'approved', 'Approved per policy');

-- ---------------------------------------------------------------------
-- payroll_records — three recent monthly periods per employee
-- ---------------------------------------------------------------------

insert into public.payroll_records (
  employee_id, period_start, period_end, gross_pay_minor, deductions_minor,
  net_pay_minor, currency, status, paid_at
) values
  -- Aditi Rao
  ('20000000-0000-0000-0000-000000000001', '2026-06-01', '2026-06-30', 25000000, 5000000, 20000000, 'INR', 'paid', '2026-07-01T06:00:00Z'),
  ('20000000-0000-0000-0000-000000000001', '2026-07-01', '2026-07-31', 25000000, 5000000, 20000000, 'INR', 'paid', '2026-08-01T06:00:00Z'),
  ('20000000-0000-0000-0000-000000000001', '2026-08-01', '2026-08-31', 25000000, 5000000, 20000000, 'INR', 'draft', null),

  -- Karan Mehta
  ('20000000-0000-0000-0000-000000000002', '2026-06-01', '2026-06-30', 18000000, 3200000, 14800000, 'INR', 'paid', '2026-07-01T06:00:00Z'),
  ('20000000-0000-0000-0000-000000000002', '2026-07-01', '2026-07-31', 18000000, 3200000, 14800000, 'INR', 'paid', '2026-08-01T06:00:00Z'),
  ('20000000-0000-0000-0000-000000000002', '2026-08-01', '2026-08-31', 18000000, 3200000, 14800000, 'INR', 'published', null),

  -- Neha Verma
  ('20000000-0000-0000-0000-000000000003', '2026-06-01', '2026-06-30', 12000000, 2000000, 10000000, 'INR', 'paid', '2026-07-01T06:00:00Z'),
  ('20000000-0000-0000-0000-000000000003', '2026-07-01', '2026-07-31', 12000000, 2000000, 10000000, 'INR', 'paid', '2026-08-01T06:00:00Z'),
  ('20000000-0000-0000-0000-000000000003', '2026-08-01', '2026-08-31', 12000000, 2000000, 10000000, 'INR', 'draft', null),

  -- Rohan Iyer
  ('20000000-0000-0000-0000-000000000004', '2026-06-01', '2026-06-30', 14500000, 2500000, 12000000, 'INR', 'paid', '2026-07-01T06:00:00Z'),
  ('20000000-0000-0000-0000-000000000004', '2026-07-01', '2026-07-31', 14500000, 2500000, 12000000, 'INR', 'paid', '2026-08-01T06:00:00Z'),
  ('20000000-0000-0000-0000-000000000004', '2026-08-01', '2026-08-31', 14500000, 2500000, 12000000, 'INR', 'published', null),

  -- Sanjana Pillai
  ('20000000-0000-0000-0000-000000000005', '2026-06-01', '2026-06-30', 11000000, 1800000, 9200000, 'INR', 'paid', '2026-07-01T06:00:00Z'),
  ('20000000-0000-0000-0000-000000000005', '2026-07-01', '2026-07-31', 11000000, 1800000, 9200000, 'INR', 'paid', '2026-08-01T06:00:00Z'),
  ('20000000-0000-0000-0000-000000000005', '2026-08-01', '2026-08-31', 11000000, 1800000, 9200000, 'INR', 'draft', null),

  -- Vikram Nair
  ('20000000-0000-0000-0000-000000000006', '2026-06-01', '2026-06-30', 9500000, 1500000, 8000000, 'INR', 'paid', '2026-07-01T06:00:00Z'),
  ('20000000-0000-0000-0000-000000000006', '2026-07-01', '2026-07-31', 9500000, 1500000, 8000000, 'INR', 'paid', '2026-08-01T06:00:00Z'),
  ('20000000-0000-0000-0000-000000000006', '2026-08-01', '2026-08-31', 9500000, 1500000, 8000000, 'INR', 'draft', null),

  -- Priya Menon
  ('20000000-0000-0000-0000-000000000007', '2026-06-01', '2026-06-30', 10500000, 1700000, 8800000, 'INR', 'paid', '2026-07-01T06:00:00Z'),
  ('20000000-0000-0000-0000-000000000007', '2026-07-01', '2026-07-31', 10500000, 1700000, 8800000, 'INR', 'paid', '2026-08-01T06:00:00Z'),
  ('20000000-0000-0000-0000-000000000007', '2026-08-01', '2026-08-31', 10500000, 1700000, 8800000, 'INR', 'published', null),

  -- Arjun Kapoor
  ('20000000-0000-0000-0000-000000000008', '2026-06-01', '2026-06-30', 8800000, 1400000, 7400000, 'INR', 'paid', '2026-07-01T06:00:00Z'),
  ('20000000-0000-0000-0000-000000000008', '2026-07-01', '2026-07-31', 8800000, 1400000, 7400000, 'INR', 'paid', '2026-08-01T06:00:00Z'),
  ('20000000-0000-0000-0000-000000000008', '2026-08-01', '2026-08-31', 8800000, 1400000, 7400000, 'INR', 'draft', null),

  -- Meera Joshi
  ('20000000-0000-0000-0000-000000000009', '2026-06-01', '2026-06-30', 10200000, 1600000, 8600000, 'INR', 'paid', '2026-07-01T06:00:00Z'),
  ('20000000-0000-0000-0000-000000000009', '2026-07-01', '2026-07-31', 10200000, 1600000, 8600000, 'INR', 'paid', '2026-08-01T06:00:00Z'),
  ('20000000-0000-0000-0000-000000000009', '2026-08-01', '2026-08-31', 10200000, 1600000, 8600000, 'INR', 'published', null),

  -- Devika Shah
  ('20000000-0000-0000-0000-000000000010', '2026-06-01', '2026-06-30', 9200000, 1450000, 7750000, 'INR', 'paid', '2026-07-01T06:00:00Z'),
  ('20000000-0000-0000-0000-000000000010', '2026-07-01', '2026-07-31', 9200000, 1450000, 7750000, 'INR', 'paid', '2026-08-01T06:00:00Z'),
  ('20000000-0000-0000-0000-000000000010', '2026-08-01', '2026-08-31', 9200000, 1450000, 7750000, 'INR', 'draft', null);

commit;
