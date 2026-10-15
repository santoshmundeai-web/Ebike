import { sql } from 'drizzle-orm';
import { char, pgEnum, pgPolicy, pgTable, text, uniqueIndex, uuid } from 'drizzle-orm/pg-core';
import {
  appRole,
  currentTenantId,
  primaryId,
  softDelete,
  tenantIsolationPolicy,
  timestamps,
} from './_tenancy';

export const tenantStatus = pgEnum('tenant_status', ['trial', 'active', 'suspended', 'closed']);

/** A dealer business. One tenant = one Better Auth organization. */
export const tenants = pgTable(
  'tenants',
  {
    id: primaryId(),
    name: text('name').notNull(),
    /** Globally unique URL handle; not tenant data, so a global unique index is correct here. */
    slug: text('slug').notNull(),
    legalName: text('legal_name'),
    gstin: char('gstin', { length: 15 }),
    stateCode: char('state_code', { length: 2 }).notNull(),
    status: tenantStatus('status').notNull().default('trial'),
    ...timestamps,
    ...softDelete,
  },
  (t) => [
    uniqueIndex('tenants_slug_key').on(t.slug),
    pgPolicy('tenant_isolation', {
      as: 'permissive',
      for: 'all',
      to: appRole,
      using: sql`${t.id} = ${currentTenantId}`,
      withCheck: sql`${t.id} = ${currentTenantId}`,
    }),
  ],
).enableRLS();

/** A showroom / service location of a tenant. */
export const branches = pgTable(
  'branches',
  {
    id: primaryId(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id),
    code: text('code').notNull(),
    name: text('name').notNull(),
    /** A branch in another state has its own GSTIN. */
    gstin: char('gstin', { length: 15 }),
    stateCode: char('state_code', { length: 2 }).notNull(),
    address: text('address'),
    phone: text('phone'),
    ...timestamps,
    ...softDelete,
  },
  (t) => [
    uniqueIndex('branches_tenant_code_key').on(t.tenantId, t.code),
    tenantIsolationPolicy(t.tenantId),
  ],
).enableRLS();
