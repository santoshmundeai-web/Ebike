# Task status — EBike Dealer Management System

Tracks progress against the [task plan](docs/EBike%20Dealer%20Management%20System%20–%20Task%20Plan.md).
Requirement IDs refer to the [requirements](docs/EBike%20Dealer%20Management%20System%20–%20Requirements.md).
Test cases for every task are in [docs/test-cases.md](docs/test-cases.md).

Last updated: 2026-10-15

**Status key:** ✅ Done · 🟡 In progress · ⬜ Not started · ⛔ Blocked (waiting on a decision or input)

## Summary

| Phase                        | Done | In progress | Not started | Blocked |
| ---------------------------- | ---- | ----------- | ----------- | ------- |
| Phase 0: Setup and decisions | 1    | 2           | 6           | 0       |
| Phase 1: MVP at our showroom | 0    | 4           | 23          | 0       |

**Now working on:** 1.1 project setup (CI and deployment still to do) and 1.2 tenant and branch model (branch scoping still to do).
**Next up:** 1.3 login and roles, then 1.4 settings and 1.6 model catalogue.

## Phase 0: Setup and decisions

| Status | Item                                                                                     | Notes                                                                                                                                                            |
| ------ | ---------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ⬜     | List the brands, models, variants and prices our showroom sells today                    | Needed for 1.6 and the pilot data load (1.26). Note which models are low-speed and which are high-speed.                                                         |
| ⬜     | Collect current paper/Excel formats: invoice, job card, stock register, service register | Needed for the invoice and job card layouts (1.15, 1.16) and imports (1.10).                                                                                     |
| ⬜     | Confirm GST rates and HSN codes for bikes, batteries, parts and labour with our CA       | Also confirm the rounding rules and tax-inclusive price handling in [ADR 002](docs/adr/002-money-as-integer-paise.md). Blocks sign-off of 1.13 and 1.19.         |
| ⬜     | Define the free-service schedule per model (km and months)                               | Needed for 1.21.                                                                                                                                                 |
| ✅     | Choose who builds it and the tech stack                                                  | Stack fixed in [CLAUDE.md](CLAUDE.md) section 2: TypeScript, Next.js, PostgreSQL, Drizzle, Better Auth, pg-boss.                                                 |
| 🟡     | Choose messaging channel and provider                                                    | CLAUDE.md chooses WhatsApp Business Cloud API plus MSG91 for SMS/OTP. Still to do: open the accounts, pick a BSP if needed, register DLT templates.              |
| ⬜     | Wireframes for the 10 core screens                                                       | Login, dashboard, customer, quotation, invoice, stock list, add bike, job card, service history, reports.                                                        |
| 🟡     | Design the data model with tenant and branch on every record                             | Foundation done: tenants, branches, audit log, RLS ([ADR 001](docs/adr/001-tenant-isolation-with-rls.md)). Each module's tables are designed as its task starts. |
| ⬜     | Pick a product name and register the domain                                              | Working name: "EBike DMS".                                                                                                                                       |

## Phase 1: MVP at our showroom

Gate 1: the system is used daily at our showroom for 4 weeks with no paper backup.

| #    | Task                                                                                    | Requirement                    | Size | Status         |
| ---- | --------------------------------------------------------------------------------------- | ------------------------------ | ---- | -------------- |
| 1.1  | Project setup: code repository, environments (dev, staging, live), automatic deployment | –                              | M    | 🟡 In progress |
| 1.2  | Tenant and branch data model; tenant isolation tests                                    | SAAS-01, SAAS-02, NFR-06       | L    | 🟡 In progress |
| 1.3  | Login with password and OTP; roles and permissions                                      | STF-01, NFR-05                 | M    | ⬜ Not started |
| 1.4  | Showroom settings: logo, GSTIN, address, invoice prefix, terms                          | STF-05                         | S    | ⬜ Not started |
| 1.5  | Audit log for invoices, payments, stock and settings                                    | NFR-08                         | M    | 🟡 In progress |
| 1.6  | Model catalogue: brand, model, variant, colour, price, tax rate                         | INV-01                         | M    | ⬜ Not started |
| 1.7  | Bike units by chassis number with serials and status                                    | INV-02, INV-03                 | M    | ⬜ Not started |
| 1.8  | Spare parts and accessories with stock levels and reorder alerts                        | INV-04, INV-05                 | M    | ⬜ Not started |
| 1.9  | Purchase entries from suppliers                                                         | INV-06                         | M    | ⬜ Not started |
| 1.10 | Excel/CSV import for models, stock and customers                                        | INV-07                         | M    | ⬜ Not started |
| 1.11 | Customer records and search by name or phone                                            | SAL-01                         | S    | ⬜ Not started |
| 1.12 | Quotation and booking with advance payment                                              | SAL-02, SAL-03                 | M    | ⬜ Not started |
| 1.13 | GST tax invoice with sequential numbering per financial year                            | SAL-04                         | L    | 🟡 In progress |
| 1.14 | Payments, part-payments, credit notes and returns                                       | SAL-05, SAL-13                 | M    | ⬜ Not started |
| 1.15 | Invoice PDF and share on WhatsApp                                                       | SAL-06                         | S    | ⬜ Not started |
| 1.16 | Job card creation with photos and service type                                          | SRV-01                         | M    | ⬜ Not started |
| 1.17 | Technician assignment and job status flow                                               | SRV-02                         | S    | ⬜ Not started |
| 1.18 | Parts and labour on job card; automatic stock deduction                                 | SRV-03                         | M    | ⬜ Not started |
| 1.19 | Service invoice with GST                                                                | SRV-05                         | S    | ⬜ Not started |
| 1.20 | Service history per bike; search by chassis number or phone                             | SRV-06                         | S    | ⬜ Not started |
| 1.21 | Free-service schedule and component warranty expiry per bike                            | SRV-07, SRV-10                 | M    | ⬜ Not started |
| 1.22 | Messaging integration and automatic service-due reminders                               | SRV-08                         | M    | ⬜ Not started |
| 1.23 | Owner dashboard: sales, collections, open jobs, low stock                               | FIN-01                         | M    | ⬜ Not started |
| 1.24 | Reports: sales, service revenue, outstanding; export to Excel/PDF                       | FIN-02, FIN-03, FIN-04, FIN-08 | M    | ⬜ Not started |
| 1.25 | Daily backups and restore test                                                          | NFR-07                         | S    | ⬜ Not started |
| 1.26 | Load our showroom's data, train staff, run 4-week pilot                                 | –                              | M    | ⬜ Not started |
| 1.27 | User guide with screenshots for Phase 1 (after Gate 1 is approved) — _added, not in the original plan_ | NFR-12                         | S    | ⬜ Not started |

Every phase ends with a user guide (see CLAUDE.md section 8, "User guide after each phase"):
written for showroom staff, step by step, with screenshots captured by Playwright from demo data,
saved in `docs/user-guide/phase-N/`. Phase 2 and Phase 3 get the same closing task when they are broken into tasks.

## Details of tasks in progress

### 1.1 Project setup — 🟡 In progress

Done:

- [x] pnpm monorepo: `apps/web`, `apps/worker`, `packages/core`, `packages/db`, `packages/shared`
- [x] TypeScript strict, ESLint, Prettier, Vitest; `pnpm lint && pnpm typecheck && pnpm test` pass
- [x] Local dev environment: Postgres 16 via docker compose, `.env.example`, migrate and seed scripts
- [x] Next.js web app builds; `/api/v1/health` checks the database
- [x] Worker starts pg-boss and runs a scheduled heartbeat job
- [x] English and Hindi message files (next-intl); installable PWA manifest

To do:

- [ ] First commit and remote repository (GitHub or similar)
- [ ] CI: run lint, typecheck and tests (with Postgres) on every push and pull request
- [ ] Dockerfiles for web and worker
- [ ] Staging and live environments: managed Postgres in an Indian region, object storage, secrets
- [ ] Automatic deployment: staging on merge to `main`, live after approval
- [ ] Sentry error reporting and structured logs in both apps
- [ ] Playwright set up for end-to-end tests (`pnpm test:e2e`)
- [ ] Playwright screenshot script for the user guides (`pnpm docs:screenshots`), using the demo tenant

### 1.2 Tenant and branch data model — 🟡 In progress

Done:

- [x] `tenants` and `branches` tables; branch code unique per tenant
- [x] Row-level security on every tenant-owned table; app connects as a role subject to RLS
- [x] `withTenant()` sets the tenant per transaction only
- [x] Isolation tests: read, update, delete, insert and moving rows across tenants are all blocked

To do:

- [ ] User-to-branch membership (a user can belong to one or more branches)
- [ ] Branch scoping: branch-level users see only their branches' data (SAAS-02)
- [ ] Tenant provisioning service used by setup and later by signup (SAAS-03)
- [ ] API layer takes the tenant only from the session, never from the request

### 1.5 Audit log — 🟡 In progress

Done:

- [x] `audit_log` table (who, when, action, entity, before, after), tenant-isolated
- [x] `writeAudit()` writes in the same transaction as the change
- [x] Append-only: the app role cannot update or delete audit rows

To do:

- [ ] Write audit entries from invoices, payments, stock movements, settings and users as those tasks land
- [ ] Owner view of the change history for a record

### 1.13 GST tax invoice — 🟡 In progress

Done (domain rules in `packages/core`, unit tested):

- [x] CGST + SGST for intra-state, IGST for inter-state, by place of supply
- [x] Tax rounded per line, then totalled, then an explicit round-off to the nearest rupee
- [x] Financial year in India time (1 April to 31 March)
- [x] Invoice number format, at most 16 characters (GST rule)

To do:

- [ ] CA confirmation of rounding and tax-inclusive price handling (Phase 0)
- [ ] Invoice tables; tax rate and HSN stored on each line
- [ ] Gap-free numbering per tenant + branch + series + financial year using a locked counter row
- [ ] Chassis, motor, battery and charger serials on the invoice (SAL-04)
- [ ] Issued invoices locked; corrections only by credit note (1.14)
- [ ] Invoice screen (mobile first)

## Open decisions

These came up while writing test cases. Each needs an answer before its task is built.

| Decision                                                                                    | Affects   | Who decides       |
| ------------------------------------------------------------------------------------------- | --------- | ----------------- |
| Can an invoice prefix change mid-year, or only from the next financial year?                | 1.4, 1.13 | Owner + CA        |
| Should stock be allowed to go negative, or should a sale be blocked when stock is short?    | 1.8, 1.18 | Owner             |
| Same phone number on two customers: warn or block? (Families often share a phone.)          | 1.11      | Owner             |
| Excel import: reject the whole file on any error, or import valid rows and report the rest? | 1.10      | Owner             |
| When does component warranty start: sale date, or the OEM's dispatch date?                  | 1.21      | Owner + OEM terms |
| Hours when reminder messages may be sent (e.g. 9 am to 9 pm)                                | 1.22      | Owner             |
