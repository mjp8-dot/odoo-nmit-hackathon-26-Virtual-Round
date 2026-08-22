# Dayflow task board

Status values: TODO, IN PROGRESS, BLOCKED, REVIEW, DONE.
Each laptop edits only its own section. Laptop 1 moves integrated items to DONE.

## Laptop 1 — Foundation and integration

| ID | Task | Status | Dependency |
| --- | --- | --- | --- |
| L1-001 | Initialize Next.js, TypeScript, Tailwind, and shadcn/ui | DONE | None |
| L1-002 | Establish module ownership and coordination documents | DONE | L1-001 |
| L1-003 | Add shared domain, API, and database types | DONE | L1-002 |
| L1-004 | Add secrets-optional Supabase/Auth foundation | DONE | L1-003 |
| L1-005 | Pass typecheck and production build | DONE | L1-004 |
| L1-006 | Publish foundation commit and coordinate feature branches | TODO | L1-005 |

## Laptop 2 — Employee experience

| ID | Task | Status | Dependency |
| --- | --- | --- | --- |
| L2-001 | Create employee application shell and navigation | TODO | L1-006 |
| L2-002 | Build employee dashboard and profile UI | TODO | L2-001, L3 contracts |
| L2-003 | Build attendance and leave UI states | TODO | L2-001, L3-002, L3-003 |
| L2-004 | Build payroll visibility UI | TODO | L2-001, L3-004 |

## Laptop 3 — Workforce logic and data

| ID | Task | Status | Dependency |
| --- | --- | --- | --- |
| L3-001 | Implement documented schema, migrations, seeds, and RLS | TODO | L1-006 |
| L3-002 | Implement attendance repository and server actions | TODO | L3-001 |
| L3-003 | Implement leave workflow and approval operations | TODO | L3-001 |
| L3-004 | Implement payroll read model and visibility rules | TODO | L3-001 |

## Laptop 4 — HR and analytics

| ID | Task | Status | Dependency |
| --- | --- | --- | --- |
| L4-001 | Create admin application shell and navigation | TODO | L1-006 |
| L4-002 | Build HR dashboard and employee management UI | TODO | L4-001, L3-001 |
| L4-003 | Build leave approval UI | TODO | L4-001, L3-003 |
| L4-004 | Build analytics and HR insights | TODO | L4-001, L3 data read models |

## Integration queue

Add branch, commit hash, checks, contract impact, and reviewer here when work is
ready. Laptop 1 owns this section to avoid merge churn.

