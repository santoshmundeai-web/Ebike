import {
  bigserial,
  index,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';
import { tenantIsolationPolicy } from './_tenancy';
import { branches, tenants } from './tenants';

export const auditAction = pgEnum('audit_action', ['create', 'update', 'delete']);

/**
 * Append-only: the app role may INSERT and SELECT but not UPDATE or DELETE
 * (revoked in migration 0001_audit_log_append_only).
 */
export const auditLog = pgTable(
  'audit_log',
  {
    id: bigserial('id', { mode: 'number' }).primaryKey(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id),
    branchId: uuid('branch_id').references(() => branches.id),
    /** Better Auth user id; null for system jobs. */
    actorUserId: text('actor_user_id'),
    action: auditAction('action').notNull(),
    entityType: text('entity_type').notNull(),
    entityId: text('entity_id').notNull(),
    before: jsonb('before'),
    after: jsonb('after'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('audit_log_tenant_entity_idx').on(t.tenantId, t.entityType, t.entityId),
    index('audit_log_tenant_created_idx').on(t.tenantId, t.createdAt),
    tenantIsolationPolicy(t.tenantId),
  ],
).enableRLS();
