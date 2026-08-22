# Dayflow project context

## Product

Dayflow is an intelligent HRMS for employees and HR teams. The target scope is
authentication and roles, employee profiles, office/remote/hybrid attendance,
leave approvals, payroll visibility, employee and admin dashboards, and HR
analytics. The foundation must stay demo-friendly, typed, secure by default,
and deployable to Vercel.

## Architecture decisions

- Next.js App Router with src/app used only for routes and route-level layouts.
- Server Components perform internal reads. Server Actions perform UI
  mutations. Route Handlers are reserved for auth callbacks, webhooks, health
  checks, or genuinely external HTTP consumers.
- Supabase Auth owns identity. public.profiles extends auth.users and owns the
  Dayflow role and employee metadata.
- Supabase Row Level Security is the final authorization boundary. The proxy is
  only an optimistic route/session refresh layer; secure role checks stay close
  to data access.
- Database rows use snake_case. Domain models and UI props use camelCase. All
  dates crossing client boundaries are ISO strings, never Date instances.
- Shared domain and transport contracts live in src/types. Feature code imports
  those contracts and must not redefine them.
- UI primitives in src/components/ui are shared shadcn source. Feature-specific
  compositions stay inside the owning feature module.

## Ownership map

### Laptop 1 — Architect and integrator

Owns src/features/auth, src/lib, src/types, src/components/ui, src/proxy.ts,
root configuration, coordination documents, integration, and release builds.

### Laptop 2 — Employee experience

Owns src/app/(employee) and src/features/employee-portal. Builds employee
dashboard, profile, attendance presentation, leave presentation, and payroll
presentation. It consumes Laptop 3 operations and does not write database
queries directly in UI components.

### Laptop 3 — Business logic and data

Owns src/features/workforce and supabase. Builds attendance, leave, payroll,
database migrations, repositories, server actions, and RLS policies. It does
not build employee or admin screens.

### Laptop 4 — HR and analytics

Owns src/app/(admin) and src/features/admin-analytics. Builds HR dashboard,
employee management, approval presentation, analytics, and insights. It
consumes Laptop 3 operations and does not duplicate workforce logic.

## Shared-file policy

Files outside the owned module paths above are shared and are integrated by
Laptop 1. A shared API or database contract change must include, in the same
commit, the affected TypeScript types, API_CONTRACT.md or DATABASE_SCHEMA.md,
and a CHANGELOG.md entry. Coordinate before renaming or removing a contract.
Prefer additive changes during the hackathon.

## Git workflow

1. Laptop 1 publishes the foundation commit to main.
2. Each teammate fetches main and creates exactly one long-lived branch:
   laptop-2/employee-experience, laptop-3/workforce-data, or
   laptop-4/admin-analytics.
3. Before starting a unit of work, pull main and rebase the laptop branch.
4. Commit small, coherent changes. Never commit .env.local, generated build
   output, or unrelated files.
5. Push the branch and send Laptop 1 the branch name, commit hash, tests run,
   contract changes, and known risks.
6. Laptop 1 integrates one branch at a time, resolves shared-file conflicts,
   and runs npm run check after every merge.

## Definition of done

A task is done only when ownership is respected, loading/error/empty states are
handled where relevant, authorization is enforced server-side, shared contracts
are documented, CHANGELOG.md is updated, and lint/typecheck/build all pass.

