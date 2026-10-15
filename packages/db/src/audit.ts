import type { Transaction } from './client';
import { auditLog } from './schema';

export interface AuditEntry {
  tenantId: string;
  branchId?: string | null;
  actorUserId: string | null;
  action: 'create' | 'update' | 'delete';
  entityType: string;
  entityId: string;
  before?: unknown;
  after?: unknown;
}

/** Write an audit row inside the same transaction as the change it records. */
export async function writeAudit(tx: Transaction, entry: AuditEntry): Promise<void> {
  await tx.insert(auditLog).values({
    tenantId: entry.tenantId,
    branchId: entry.branchId ?? null,
    actorUserId: entry.actorUserId,
    action: entry.action,
    entityType: entry.entityType,
    entityId: entry.entityId,
    before: entry.before ?? null,
    after: entry.after ?? null,
  });
}
