# 003 — Authentication, tenants and roles

Status: accepted (2026-10-16) · Task 1.3 (STF-01, NFR-05)

## Decision

- **Better Auth** with the Drizzle adapter, the organization plugin and the phone-number plugin.
  One organization = one tenant; `organization.id` equals `tenants.id`.
- **Platform tables without RLS.** `user`, `session`, `account`, `verification`, `organization`,
  `member`, `invitation` have no `tenant_id`: one person can work for several dealers, and login
  has to find their memberships before any tenant is known. Only the auth layer
  (`apps/web/src/server/auth`) touches them. The RLS guard test (TC-1.2-11) lists them explicitly,
  so any other new table without RLS fails the build.
- **Branch assignments** live in `user_branches`, a normal tenant table with RLS.
- **Staff are created by the owner**; public sign-up is off. Staff sign in with email + password,
  or phone + OTP (many showroom staff have no email; they get a placeholder `@staff.ebike.invalid`).
- **OTP**: 6 digits, valid 5 minutes, 3 attempts, rate-limited per client. OTPs are sent only to
  phone numbers of active staff; other numbers get the same reply and no SMS (no user enumeration,
  no SMS cost abuse). The OTP goes through the job queue to the worker's SMS provider (MSG91;
  console output in development), never inline in the request.
- **Session**: expires after `SESSION_IDLE_HOURS` (default 12) without activity.
- **Who can sign in**: a session is created only for an active user with at least one tenant
  membership. Removing someone's access deletes their membership and branch assignments, revokes
  all their sessions and writes an audit entry.
- **Permissions** are a pure matrix in `packages/core/src/permissions.ts` (from the requirements'
  roles table), checked on the server for every API route (`withAuth`) and server action. Better
  Auth's own role checks only govern managing the organization itself (owner only).
- **Branch scope**: Owner and Accountant work across all branches; other roles see only the
  branches they are assigned to.

## Consequences

- Phase 2 self-signup reuses `provisionTenant`.
- Super-admin access to tenant data (SAAS-12) needs its own audited path; nothing here grants it.
- Rate-limit counters are in memory, which is fine for one web instance. Move them to the database
  or a shared store before running several instances.
- MSG91 delivery must be checked with the real account and DLT template before go-live.
