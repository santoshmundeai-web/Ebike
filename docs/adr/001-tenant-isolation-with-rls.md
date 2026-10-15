# 001 — Tenant isolation with Postgres RLS and two database roles

Status: accepted (2026-10-15)

## Context

Every dealer's data must be invisible to every other dealer, even if application code has a bug.

## Decision

- Two roles. `ebike` owns the schema and runs migrations. `ebike_app` is what the web app and
  worker connect as. Table owners bypass RLS, so the app never connects as the owner.
  Roles and default grants are created once per environment by `packages/db/init/01-roles.sql`.
- Every tenant-owned table has `ENABLE ROW LEVEL SECURITY` and a `tenant_isolation` policy
  (`packages/db/src/schema/_tenancy.ts`) comparing `tenant_id` with
  `nullif(current_setting('app.tenant_id', true), '')::uuid`. Unset means NULL, so no rows match.
- `withTenant(db, tenantId, fn)` opens a transaction and sets `app.tenant_id` with `is_local = true`,
  so the setting cannot leak to the next user of a pooled connection.
- The `tenants` row itself is visible only when its id is the current tenant. Provisioning a new
  tenant generates its id first and inserts it inside `withTenant` for that id.
- `audit_log` is append-only for the app role (UPDATE/DELETE/TRUNCATE revoked in migration 0001).
- pg-boss stores jobs in its own `pgboss` schema and connects as the owner (it creates its schema);
  job handlers that touch tenant data still go through `withTenant` on the app-role connection.

## Consequences

- Each new tenant-owned table must use `tenantIsolationPolicy(t.tenantId)` and `.enableRLS()`, and
  get cases in `packages/db/src/tenant-isolation.test.ts`.
- Cross-tenant work (super admin, platform reports) needs a separate, audited path — not built yet.
