import { sql, type SQL } from 'drizzle-orm';
import { pgPolicy, pgRole, timestamp, uuid, type AnyPgColumn } from 'drizzle-orm/pg-core';

/** The RLS-restricted role the app connects as. Created by packages/db/init/01-roles.sql. */
export const appRole = pgRole('ebike_app').existing();

/** Tenant id set per transaction by `withTenant`; NULL when unset, so nothing matches. */
export const currentTenantId: SQL = sql`nullif(current_setting('app.tenant_id', true), '')::uuid`;

/** Every tenant-owned table gets this RLS policy on its `tenant_id` column. */
export function tenantIsolationPolicy(tenantColumn: AnyPgColumn) {
  return pgPolicy('tenant_isolation', {
    as: 'permissive',
    for: 'all',
    to: appRole,
    using: sql`${tenantColumn} = ${currentTenantId}`,
    withCheck: sql`${tenantColumn} = ${currentTenantId}`,
  });
}

export const timestamps = {
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
};

/** Soft delete for master data (CLAUDE.md section 5). */
export const softDelete = {
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
};

export const primaryId = () => uuid('id').primaryKey().defaultRandom();
