# DAYFLOW — PROJECT CONTEXT

## 1. Project

**Name:** Dayflow — Human Resource Management System
**Tagline:** Every workday, perfectly aligned.
**Hackathon:** Odoo × NMIT Virtual Round
**Development Model:** 4 laptops working simultaneously with AI coding agents
**Time Constraint:** Approximately 4 hours remaining

---

# 2. Product Vision

Dayflow is a modern Human Resource Management System that centralizes the employee lifecycle into one platform.

The system connects:

* Employees
* HR Officers
* Administrators

through:

* employee management
* attendance
* leave management
* approval workflows
* payroll visibility
* HR analytics

Dayflow should feel like a lightweight modern alternative to enterprise HR platforms such as Workday or Odoo HR, not like a simple CRUD college project.

---

# 3. Required Product Scope

These are requirements from the provided Dayflow problem statement.

## Authentication

Users must be able to:

* Sign up
* Sign in
* Use email and password
* Have role-based access

Roles:

* EMPLOYEE
* ADMIN / HR

Successful login must redirect users to the appropriate dashboard.

---

# 4. User Roles

## Employee

Employees can:

* View their personal profile
* View job information
* Edit permitted personal fields
* View attendance
* Check in
* Check out
* Apply for leave
* View leave request status
* View salary/payroll information

Employees must only access their own records.

---

## Admin / HR

Admin/HR can:

* View all employees
* Manage employee information
* View attendance records
* View employee attendance
* Review leave requests
* Approve leave
* Reject leave
* Add approval comments
* View payroll information
* Update salary structures
* View HR analytics

---

# 5. Core Modules

Dayflow consists of the following major modules.

## 5.1 Authentication

Features:

* Sign Up
* Sign In
* Role-based access
* Employee/Admin authorization
* Protected routes
* Logout

---

## 5.2 Employee Profile

Employee profile contains:

* Employee ID
* Name
* Email
* Phone
* Address
* Department
* Designation
* Joining date
* Profile picture
* Job information
* Salary information
* Documents

Employee can edit only approved fields such as:

* Phone
* Address
* Profile picture

Admin can manage employee information.

---

# 6. Attendance Management

Required attendance features:

* Check-in
* Check-out
* Daily attendance view
* Weekly attendance view

Attendance statuses:

* PRESENT
* ABSENT
* HALF_DAY
* LEAVE

Employees can view only their own attendance.

HR/Admin can view attendance of all employees.

---

# 7. Dayflow Attendance Enhancement

This section is a hackathon enhancement and not a mandatory requirement from the original specification.

Dayflow should support modern working environments:

* OFFICE
* REMOTE
* HYBRID

## Office

Office check-in may use browser geolocation to determine whether the employee is near the configured workplace.

## Remote

Remote employees must not be rejected simply because they are outside office geolocation.

Remote attendance can use:

* authenticated session
* registered/recognized work mode
* timestamp
* work-session information

## Hybrid

Hybrid employees may work either:

* remotely
* from office

depending on their assigned or selected work mode.

---

## Attendance Confidence

If implemented, Dayflow may calculate a simple attendance confidence indicator using signals such as:

* correct work mode
* location verification
* valid check-in time
* valid work session

This must remain explainable.

Do not build complex surveillance or invasive employee monitoring.

---

# 8. Attendance Corrections

Employees must NOT directly overwrite attendance records.

If an employee forgets to check in or reports an incorrect attendance record:

Employee
→ submits correction request
→ HR reviews
→ HR approves/rejects
→ attendance changes
→ action is recorded

Implement only if core functionality is already stable.

---

# 9. Leave Management

Employees can apply for:

* PAID leave
* SICK leave
* UNPAID leave

Leave request contains:

* Employee
* Leave type
* Start date
* End date
* Reason / remarks

Leave statuses:

* PENDING
* APPROVED
* REJECTED

---

## Leave Workflow

Employee submits leave

→ PENDING

→ HR sees request

→ HR approves or rejects

→ Employee sees updated status

HR may also add comments.

This workflow is one of the most important end-to-end flows of Dayflow.

---

# 10. Payroll

## Employee

Payroll is READ ONLY.

Employee should be able to view:

* Base salary
* Allowances
* Deductions
* Net salary

Do NOT build a complete payroll calculation engine unless all mandatory features are already complete.

---

## Admin / HR

Admin can:

* View employee payroll
* View salary structure
* Update salary structure where supported

---

# 11. Dashboards

## Employee Dashboard

Should include:

* Employee/profile summary
* Today's attendance
* Work mode
* Check-in/check-out
* Leave balance
* Recent leave requests
* Payroll summary
* Recent activity

Navigation:

* Dashboard
* Profile
* Attendance
* Leave
* Payroll

---

## HR/Admin Dashboard

Should include:

* Total employees
* Present today
* Absent/on leave
* Remote employees
* Pending leave requests
* Attendance percentage
* Payroll overview

Navigation:

* Dashboard
* Employees
* Attendance
* Leave Approvals
* Payroll
* Analytics

---

# 12. HR Analytics

Analytics are an enhancement after core workflows work.

Useful metrics:

* Attendance percentage
* Attendance trend
* Leave trend
* Workforce distribution
* Remote/office/hybrid distribution
* Pending approvals

Preferred charting library:

**Recharts**

---

# 13. HR Insights

Do NOT prioritize an AI chatbot.

Prefer useful business insights such as:

* "Attendance this week is 92%."
* "Engineering currently has 4 pending leave requests."
* "3 employees are working remotely today."
* "Late arrivals increased this week."

Initially these may be calculated deterministically from application data.

External LLM/API integration is optional and must not block the core application.

---

# 14. Technology Stack

Architecture is locked unless Laptop 1 explicitly approves a change.

## Application

* Next.js App Router
* TypeScript

## UI

* Tailwind CSS
* shadcn/ui

## Database

* PostgreSQL through Supabase

## Authentication

* Supabase Auth

## Storage

* Supabase Storage if required for profile pictures/documents

## Analytics

* Recharts

## Deployment

* Vercel

## Version Control

* GitHub

---

# 15. Architecture Principle

We have ONE application.

Do not create separate independent applications for different laptops.

High-level architecture:

Employee / Admin

→ Next.js Application

→ Authentication / Authorization

→ Business Logic

→ Supabase PostgreSQL

→ Analytics / Insights

---

# 16. Repository Structure

Current architecture:

```text
src/
├── app/
│   ├── (auth)/
│   ├── (employee)/
│   ├── (admin)/
│   ├── layout.tsx
│   └── page.tsx
│
├── components/
│   └── ui/
│
├── features/
│   ├── auth/
│   ├── employee-portal/
│   ├── workforce/
│   └── admin-analytics/
│
├── lib/
│   └── supabase/
│
└── types/
    ├── domain/
    ├── api.ts
    └── database.ts
```

Do not restructure these directories without permission from Laptop 1.

---

# 17. Team Ownership

There are FOUR independent development owners.

---

## LAPTOP 1 — CTO / PLATFORM / INTEGRATION

Available AI:

* GPT Plus
* Gemini Pro

Owns:

* Main branch
* Project architecture
* Supabase configuration
* Authentication foundation
* Shared TypeScript contracts
* Shared project configuration
* Environment configuration
* Integration
* Build stability
* Vercel deployment

Laptop 1 is the ONLY integration authority.

Laptop 1 must NOT unnecessarily implement features owned by other developers.

---

## LAPTOP 2 — EMPLOYEE EXPERIENCE

Available AI:

* GPT Plus
* Gemini Pro

Branch:

```text
feature/employee-portal
```

Owns:

```text
src/features/employee-portal/
src/app/(employee)/
```

Responsible for:

* Employee dashboard
* Employee profile UI
* Attendance UI
* Leave UI
* Payroll UI
* Employee navigation
* Employee UX

Laptop 2 does NOT own backend/business logic.

---

## LAPTOP 3 — WORKFORCE CORE

Available AI:

* Gemini Pro

Branch:

```text
feature/workforce-core
```

Owns:

```text
src/features/workforce/
```

Responsible for:

* Employee data operations
* Attendance business logic
* Check-in
* Check-out
* Attendance history
* Leave submission
* Leave approval state transitions
* Payroll data operations
* Validation

Laptop 3 does NOT own employee or admin UI.

---

## LAPTOP 4 — ADMIN / ANALYTICS

Available AI:

* Claude Pro
* GPT Go

Branch:

```text
feature/admin-analytics
```

Owns:

```text
src/features/admin-analytics/
src/app/(admin)/
```

Responsible for:

* HR dashboard
* Employee management UI
* Attendance monitoring UI
* Leave approval UI
* Payroll Admin UI
* Analytics
* HR insights

Laptop 4 does NOT own workforce backend logic.

---

# 18. Branch Policy

Branches:

```text
main
│
├── feature/employee-portal
│
├── feature/workforce-core
│
└── feature/admin-analytics
```

Laptop 1 owns:

```text
main
```

Laptops 2, 3 and 4 MUST NOT directly modify or push to `main`.

Their workflow:

```text
Work on assigned branch
→ test
→ commit
→ push branch
→ Laptop 1 reviews
→ Laptop 1 integrates
```

---

# 19. Shared Files

The following are SHARED / CONTROLLED files:

```text
PROJECT_CONTEXT.md
DATABASE_SCHEMA.md
API_CONTRACT.md
package.json
shared TypeScript types
Supabase configuration
authentication configuration
```

Laptop 1 owns final changes to shared architecture.

Other laptops must not silently modify them.

---

# 20. Permission Protocol

If any AI agent discovers that its task requires modifying:

* another developer's module
* shared TypeScript contracts
* database schema
* API contracts
* authentication
* Supabase configuration
* package.json in a project-wide manner
* another developer's branch

IT MUST STOP.

Do NOT make the change.

Output:

```text
PERMISSION REQUEST

Developer:
Current task:

Required change:

Reason:

Files affected:

Other module/developer affected:

Why work cannot safely continue without this change:

Proposed solution:
```

Then WAIT for human approval.

---

# 21. Cross-Team Rule

Never modify another developer's working code simply because a different implementation appears cleaner.

Do not refactor another developer's module without explicit approval.

Do not change public interfaces without coordination.

Do not rename shared types or routes unexpectedly.

---

# 22. API Contract Rule

Frontend and backend must communicate through agreed contracts.

The current API contract is documented in:

```text
API_CONTRACT.md
```

Do not invent conflicting API names.

If a required API does not exist:

STOP and request it.

Example:

```text
PERMISSION REQUEST

Required API:
POST /attendance/check-in

Consumer:
Employee Portal

Expected Input:
employeeId
workMode

Expected Output:
attendance
verificationStatus

Reason:
Employee attendance UI cannot connect to workforce backend without this contract.
```

---

# 23. Database Rule

Database design is documented in:

```text
DATABASE_SCHEMA.md
```

Core entities should cover at least:

* users/auth identities
* employees
* attendance
* leave requests
* payroll

Additional tables must only be added when they solve an actual requirement.

Avoid unnecessary database complexity during the hackathon.

---

# 24. AI Coding Rules

Every AI agent must:

1. Read this file before coding.
2. Read `AGENTS.md`.
3. Read `API_CONTRACT.md`.
4. Read `DATABASE_SCHEMA.md`.
5. Confirm its assigned branch.
6. Confirm its ownership directory.
7. Work only inside its assigned responsibility.
8. Keep changes small.
9. Run TypeScript checks after meaningful changes.
10. Avoid large autonomous refactors.
11. Avoid changing architecture.
12. Prioritize working software.

---

# 25. Time Management

We have approximately four hours.

## P0 — MUST WORK

* Authentication
* Employee/Admin roles
* Employee dashboard
* HR dashboard
* Employee profile
* Attendance check-in/check-out
* Attendance history
* Leave request
* HR leave approval/rejection
* Employee sees leave status
* Payroll visibility
* Database persistence
* Deployment

---

## P1 — COMPETITIVE

After P0 works:

* Office/Remote/Hybrid attendance
* Location verification for office
* Attendance confidence indicator
* Search/filter employees
* Dashboard charts
* Attendance correction workflow
* Better validation

---

## P2 — WOW

Only after application is stable:

* HR intelligence insights
* Advanced analytics
* Notifications
* AI-generated HR summaries
* additional visual polish

---

# 26. Non-Goals

Do NOT spend hackathon time building:

* Complex facial recognition
* Employee surveillance
* Screenshot monitoring
* Full payroll calculation engine
* Microservices
* Blockchain
* Voice assistant
* Complex ML models
* Large chatbot
* Overengineered notification infrastructure
* Multiple frontend/backend deployments unless absolutely necessary

---

# 27. Primary Demo Workflow

The project should prioritize this complete working journey:

```text
Employee signs in
        ↓
Employee Dashboard
        ↓
Employee checks in
        ↓
Attendance stored
        ↓
Employee applies for leave
        ↓
Leave becomes PENDING
        ↓
HR/Admin signs in
        ↓
HR sees employee information
        ↓
HR sees attendance
        ↓
HR opens leave request
        ↓
HR approves leave
        ↓
Leave becomes APPROVED
        ↓
Employee dashboard reflects new status
        ↓
HR analytics reflect organization data
```

This journey is more important than having many disconnected features.

---

# 28. Design Direction

Dayflow should look like:

* professional enterprise SaaS
* clean
* modern
* responsive
* information-dense without clutter

Prefer:

* sidebar navigation
* status badges
* tables
* cards
* charts
* strong hierarchy
* clear forms
* loading states
* empty states
* validation messages

Avoid:

* excessive gradients
* excessive animations
* glassmorphism everywhere
* giant marketing sections
* unnecessary landing pages
* decorative AI interfaces

---

# 29. Definition of Done

A feature is DONE only when:

* It works
* It matches existing contracts
* TypeScript passes
* It does not break existing features
* It has appropriate loading/error/empty handling
* It works with the assigned role
* It can be demonstrated
* Changes are committed

"UI exists" does not mean the feature is complete if the required workflow does not work.

---

# 30. Git Commit Requirement

Every team member must create meaningful commits regularly and satisfy the hackathon's hourly commit requirement.

Recommended format:

```text
feat(employee): add leave request interface
feat(workforce): implement attendance check-in
feat(admin): add leave approval workflow
feat(auth): implement role-based login
fix(workforce): validate leave date range
```

Avoid meaningless messages such as:

```text
update
changes
final
test
```

---

# 31. Integration Philosophy

The objective is NOT:

"Four AI agents generate as much code as possible."

The objective is:

"Four AI-assisted developers produce one stable Dayflow application."

Therefore:

**Coordination > code volume.**

**Working workflow > number of features.**

**Stable integration > architectural perfection.**

**Complete HRMS > disconnected demos.**
