# CLAUDE.md — EBike Dealer Management System

Guidance for Claude (and humans) working in this repository. Read this before writing code.

## 1. What we are building

A multi-tenant SaaS dealer management system for e-bike / electric two-wheeler showrooms in India
(small, mid and large dealers, including multi-brand and low-speed e-bike dealers).
It covers sales and GST billing, inventory (bikes by chassis number, parts), service and job cards,
battery/warranty tracking, reminders, CRM, reports, and the SaaS layer (tenants, plans, subscriptions, super admin).

Our own showroom is the first tenant and pilot site.

- Requirements (source of truth for scope, requirement IDs like `SAL-04`, `SRV-08`):
  https://claude.ai/code/artifact/565fad89-0a17-42bd-8e45-d453363e67a1
- Task plan (phases, task numbers like `1.13`):
  https://claude.ai/code/artifact/43b6bab0-9ff3-4911-8a44-87435b57de11
- Local copies of both are in `docs/`. Task status is tracked in `task.md` (update it when a task
  starts or finishes); test cases per task are in `docs/test-cases.md`, and automated tests start
  their name with the test case ID (e.g. `TC-1.13-09`).

**Current phase: Phase 1 — MVP at our showroom.** Do not build Phase 2/3 features unless asked,
but never make a design choice that blocks them (especially multi-tenancy and multi-branch).

### Product differentiators (keep these in mind when designing features)

1. Deep e-bike support: battery, motor, controller, charger tracked by serial number, with per-component warranty and battery health.
2. Multi-brand, including low-speed (non-RTO) models.
3. WhatsApp-first communication (invoices, reminders, "bike ready").
4. Mobile-first: an owner must be able to run the showroom from a mid-range Android phone on 4G.
5. Self-serve setup in under 30 minutes; Hindi and regional languages.

## 2. Tech stack

TypeScript end to end, one language for the whole team and for AI-assisted development.

| Layer              | Choice                                                                | Notes                                                              |
| ------------------ | --------------------------------------------------------------------- | ------------------------------------------------------------------ |
| Runtime            | Node.js (current LTS)                                                 |                                                                    |
| Package manager    | pnpm workspaces (monorepo)                                            |                                                                    |
| Web app            | Next.js (App Router) + React                                          | Dealer app, super-admin panel, and the REST API in one deployable  |
| UI                 | Tailwind CSS + shadcn/ui, lucide icons                                | Mobile-first layouts; installable PWA                              |
| Forms / validation | react-hook-form + Zod                                                 | Zod schemas are shared between client and server                   |
| Tables             | TanStack Table                                                        |                                                                    |
| Database           | PostgreSQL (16+)                                                      | Managed instance in an Indian region (e.g. AWS Mumbai)             |
| ORM / migrations   | Drizzle ORM + drizzle-kit                                             | SQL-first; works cleanly with Row-Level Security                   |
| Auth               | Better Auth (email/password + phone OTP, organizations)               | Tenant = organization                                              |
| Background jobs    | pg-boss (Postgres-backed queue) in `apps/worker`                      | No Redis needed in Phase 1                                         |
| Messaging          | WhatsApp Business Cloud API (via a BSP if needed) + MSG91 for SMS/OTP | All sends go through one `messaging` module; DLT templates for SMS |
| PDFs               | HTML templates rendered to PDF (Playwright/Chromium) in the worker    | Invoices, job cards, estimates                                     |
| File storage       | S3-compatible object storage (AWS S3 Mumbai or Cloudflare R2)         | Job-card photos, logos, PDFs                                       |
| Payments (Phase 2) | Razorpay (Subscriptions + webhooks)                                   | SaaS billing to dealers                                            |
| i18n               | next-intl                                                             | English first; Hindi next; strings never hard-coded                |
| Testing            | Vitest (unit/integration), Playwright (end-to-end)                    |                                                                    |
| Lint / format      | ESLint + Prettier                                                     |                                                                    |
| Hosting            | Docker images; any container host in India                            | Keep cloud-agnostic; no vendor-only APIs in core code              |
| Monitoring         | Sentry (errors) + structured JSON logs                                |                                                                    |

Why this stack: one language, a single deployable for the MVP, Postgres RLS for hard tenant isolation,
no extra infrastructure (queue lives in Postgres), cheap to run for a small team, and easy to scale later
by splitting the worker or adding a mobile app against the same REST API.

## 3. Repository layout

```
apps/
  web/          Next.js app: dealer UI (/app), super admin (/admin), REST API (/api/v1)
  worker/       Background jobs: reminders, WhatsApp/SMS sends, PDF generation, scheduled reports
packages/
  db/           Drizzle schema, migrations, RLS policies, seed data (master catalogue)
  core/         Pure domain logic, no I/O: money, GST, invoice numbering rules, service schedules, warranty
  shared/       Zod schemas, types, constants shared by web and worker
  ui/           Shared UI components (only if reused by more than one app)
docs/           ADRs (architecture decision records) and notes
```

Domain modules inside `apps/web` follow the requirement areas: `sales`, `inventory`, `service`,
`crm`, `finance`, `staff`, `platform` (tenants, plans, billing).

## 4. Commands

First time: copy `.env.example` to `.env`, then `pnpm install`, `pnpm db:up`, `pnpm db:migrate`, `pnpm db:seed`.

```
pnpm install              # install
pnpm db:up                # start local Postgres (docker compose); creates the ebike_app role on first run
pnpm dev                  # web (http://localhost:3000) + worker in dev mode
pnpm db:generate          # generate migration from schema changes
pnpm db:migrate           # apply migrations
pnpm db:seed              # seed master catalogue + demo tenant
pnpm test                 # unit + integration tests (DB tests skip if DATABASE_URL is unset)
pnpm test:e2e             # Playwright tests
pnpm lint && pnpm typecheck
```

Before saying a task is done: `pnpm lint && pnpm typecheck && pnpm test` must pass.

## 5. Non-negotiable rules

### Multi-tenancy (most important)

- Every tenant-owned table has `tenant_id` (NOT NULL, indexed); branch-scoped tables also have `branch_id`.
- Postgres Row-Level Security is enabled on every tenant-owned table. The app sets
  `app.tenant_id` per request/transaction; policies filter on it. Never disable RLS to "make a query work".
- Never accept `tenant_id` from the client. It comes from the authenticated session only.
- Every new table or query gets a test proving tenant A cannot read or write tenant B's data.
- Super-admin access to tenant data only through an audited "support access" path.
- Unique constraints are per tenant (e.g. `UNIQUE (tenant_id, chassis_number)`), never global.

### Money and GST

- Store money as integer paise (`bigint`). Never use floats for money. Format only at the edge.
- Tax rate is stored per line item at the time of sale (rates and HSN codes can change later).
- Line items keep: HSN/SAC code, taxable value, CGST, SGST, IGST, rate. Intra-state → CGST+SGST; inter-state → IGST, based on place of supply.
- Rounding: compute per line, round to paise, then total; invoice round-off line to nearest rupee is explicit.
- GST logic lives in `packages/core` with thorough unit tests. Confirm rules with the CA before changing them.

### Invoices and numbering

- Invoice numbers are sequential per tenant + branch + series + financial year (India FY: 1 April – 31 March), with no gaps.
- Allocate numbers inside the same DB transaction as the invoice insert, using a locked counter row.
- Issued invoices are never edited or deleted. Corrections use credit notes (`SAL-13`).
- Dates/times stored in UTC; business dates (invoice date, FY) computed in `Asia/Kolkata`.

### Vehicles and components

- A bike unit is identified by chassis number (VIN); motor, battery, controller and charger serials are stored as separate component records linked to the unit, each with its own warranty start/end.
- Unit status flow: `in_transit → in_stock → booked → sold` (plus `demo`). Changes go through one service function that also writes the audit log.
- Stock quantity changes (parts) only via stock movement records (purchase, sale, job card, adjustment) — never by updating a quantity column directly.

### Audit and data safety

- Creates/updates/deletes on invoices, payments, stock, settings and users write to `audit_log` (who, when, before, after).
- Soft-delete for master data; hard delete only for tenant data-deletion requests (DPDP Act).
- No customer personal data in logs or error reports (mask phone numbers, ID numbers).

### Messaging

- All WhatsApp/SMS sends go through `messaging` in the worker via the job queue — never sent inline in a request.
- Respect customer opt-out; record every message sent (template, status, cost) per tenant for usage limits.

## 6. Coding conventions

- TypeScript `strict` on. No `any` without a comment explaining why.
- Validate every API input with Zod at the boundary; return typed errors.
- REST API under `/api/v1/...`, resource-style, JSON, cursor pagination. It must be usable by a future mobile app.
- Server components / server actions may call domain services, but business rules live in domain services or `packages/core`, not in UI components.
- Name things in the domain's language: `jobCard`, `chassisNumber`, `quotation`, `booking`, `creditNote`.
- All user-facing text through next-intl message files; no hard-coded strings in components.
- Mobile-first: design each screen for 360 px width first; core flows (invoice, job card) must work one-handed.
- Keep pages fast on 4G: avoid heavy client bundles; paginate lists; lazy-load charts.

## 7. Testing expectations

- `packages/core`: unit tests for every rule (GST split, rounding, FY boundaries, invoice numbering, service due dates, warranty expiry).
- Tenant isolation tests for every tenant-owned table.
- Playwright end-to-end for the critical flows: login → create customer → quotation → invoice → payment; job card → parts → service invoice; service reminder scheduled.
- Bug fixes come with a test that fails before the fix.

## 8. Workflow

- Reference requirement IDs and task numbers in branch names, commits and PRs, e.g. `feat(sales): GST invoice numbering [SAL-04, task 1.13]`.
- Record significant technical decisions as short ADRs in `docs/adr/NNN-title.md`.
- Database changes always via a migration; never edit an applied migration.
- When a requirement is unclear, check the requirements doc first; if still unclear, ask instead of guessing.
- Never commit secrets. Config via environment variables, documented in `.env.example`.

### User guide after each phase

When a phase is approved (its gate is passed), write a user guide for that phase before starting the next one.

- Audience: showroom staff, not developers. Plain language, one section per role and per everyday task
  (e.g. "Create an invoice", "Open a job card"), step-by-step with a screenshot per step.
- Screenshots are captured by a Playwright script (not by hand) so they can be regenerated when the UI changes:
  phone viewport (360 px) first, desktop where it helps; demo tenant seed data only — never real customer data.
- Location: `docs/user-guide/phase-N/` (Markdown + `images/`). English first; Hindi once the Hindi UI ships.
- Track it as the last item of the phase in `task.md`.

## 9. Out of scope for now

- Full accounting ledger (we export to Tally/Zoho later).
- Native mobile apps (the PWA covers Phase 1–2).
- IoT/telematics, GST e-invoicing (IRN), public API — Phase 3.
