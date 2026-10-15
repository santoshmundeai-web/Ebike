import { randomUUID } from 'node:crypto';
import { eq, sql } from 'drizzle-orm';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { writeAudit } from './audit';
import { createDb, withTenant, type Database } from './client';
import { auditLog, branches, tenants, user, userBranches } from './schema';

/**
 * Proves tenant A cannot read or write tenant B's rows (CLAUDE.md section 5).
 * Runs against a migrated database as the RLS-restricted app role (DATABASE_URL).
 */
const url = process.env.DATABASE_URL;

const INSUFFICIENT_PRIVILEGE = '42501'; // also raised for row-level security violations
const UNIQUE_VIOLATION = '23505';

/** Drizzle wraps driver errors; the Postgres SQLSTATE is on `cause.code`. */
async function expectPgError(promise: Promise<unknown>, code: string): Promise<void> {
  await expect(promise).rejects.toMatchObject({ cause: { code } });
}

describe.skipIf(!url)('tenant isolation (RLS)', () => {
  let db: Database;
  let close: () => Promise<void>;
  const tenantA = randomUUID();
  const tenantB = randomUUID();
  let branchA: string;
  let branchB: string;

  async function provision(tenantId: string): Promise<string> {
    return withTenant(db, tenantId, async (tx) => {
      await tx.insert(tenants).values({
        id: tenantId,
        name: `Test ${tenantId}`,
        slug: `test-${tenantId}`,
        stateCode: '27',
      });
      const [branch] = await tx
        .insert(branches)
        .values({ tenantId, code: 'MAIN', name: 'Main', stateCode: '27' })
        .returning({ id: branches.id });
      await writeAudit(tx, {
        tenantId,
        actorUserId: null,
        action: 'create',
        entityType: 'branch',
        entityId: branch!.id,
      });
      const userId = randomUUID();
      await tx.insert(user).values({ id: userId, name: 'Staff', email: `${userId}@test.invalid` });
      await tx.insert(userBranches).values({ tenantId, userId, branchId: branch!.id });
      return branch!.id;
    });
  }

  beforeAll(async () => {
    ({ db, close } = createDb(url!, { max: 2 }));
    branchA = await provision(tenantA);
    branchB = await provision(tenantB);
  });

  afterAll(async () => {
    await close?.();
  });

  it('TC-1.2-01 connects as a role that is subject to RLS', async () => {
    const [row] = await db.execute<{ bypass: boolean; superuser: boolean }>(
      sql`select rolbypassrls as bypass, rolsuper as superuser from pg_roles where rolname = current_user`,
    );
    expect(row).toEqual({ bypass: false, superuser: false });
  });

  it('TC-1.2-02 sees nothing when no tenant is set', async () => {
    expect(await db.select().from(tenants)).toEqual([]);
    expect(await db.select().from(branches)).toEqual([]);
    expect(await db.select().from(auditLog)).toEqual([]);
    expect(await db.select().from(userBranches)).toEqual([]);
  });

  it.each([
    ['tenants', () => tenants, () => tenants.id],
    ['branches', () => branches, () => branches.tenantId],
    ['audit_log', () => auditLog, () => auditLog.tenantId],
    ['user_branches', () => userBranches, () => userBranches.tenantId],
  ] as const)(
    'TC-1.2-03 / TC-1.5-03 %s: reads only the current tenant',
    async (_name, table, tenantColumn) => {
      const rows = await withTenant(db, tenantA, (tx) =>
        tx.select({ tenantId: tenantColumn() }).from(table()),
      );
      expect(rows.length).toBeGreaterThan(0);
      expect(rows.every((r) => r.tenantId === tenantA)).toBe(true);
    },
  );

  it('TC-1.2-04 cannot read another tenant by id', async () => {
    const rows = await withTenant(db, tenantA, (tx) =>
      tx.select().from(branches).where(eq(branches.id, branchB)),
    );
    expect(rows).toEqual([]);
  });

  it('TC-1.2-05 cannot update or delete another tenant', async () => {
    await withTenant(db, tenantA, async (tx) => {
      const updated = await tx
        .update(branches)
        .set({ name: 'hijacked' })
        .where(eq(branches.id, branchB))
        .returning();
      expect(updated).toEqual([]);
      const deleted = await tx.delete(branches).where(eq(branches.id, branchB)).returning();
      expect(deleted).toEqual([]);
      const updatedTenant = await tx
        .update(tenants)
        .set({ name: 'hijacked' })
        .where(eq(tenants.id, tenantB))
        .returning();
      expect(updatedTenant).toEqual([]);
    });
    const [b] = await withTenant(db, tenantB, (tx) =>
      tx.select().from(branches).where(eq(branches.id, branchB)),
    );
    expect(b?.name).toBe('Main');
  });

  it('TC-1.2-06 cannot insert rows for another tenant', async () => {
    await expectPgError(
      withTenant(db, tenantA, (tx) =>
        tx.insert(branches).values({ tenantId: tenantB, code: 'X', name: 'X', stateCode: '27' }),
      ),
      INSUFFICIENT_PRIVILEGE,
    );
    await expectPgError(
      withTenant(db, tenantA, (tx) =>
        writeAudit(tx, {
          tenantId: tenantB,
          actorUserId: null,
          action: 'create',
          entityType: 'branch',
          entityId: branchB,
        }),
      ),
      INSUFFICIENT_PRIVILEGE,
    );
  });

  it('TC-1.2-07 cannot move a row to another tenant', async () => {
    await expectPgError(
      withTenant(db, tenantA, (tx) =>
        tx.update(branches).set({ tenantId: tenantB }).where(eq(branches.id, branchA)),
      ),
      INSUFFICIENT_PRIVILEGE,
    );
  });

  it('TC-1.2-10 keeps branch codes unique per tenant, not globally', async () => {
    // Both tenants already have a MAIN branch from provisioning.
    await expectPgError(
      withTenant(db, tenantA, (tx) =>
        tx
          .insert(branches)
          .values({ tenantId: tenantA, code: 'MAIN', name: 'Dup', stateCode: '27' }),
      ),
      UNIQUE_VIOLATION,
    );
  });

  it('TC-1.5-02 does not let the app role rewrite the audit log', async () => {
    await expectPgError(
      withTenant(db, tenantA, (tx) => tx.update(auditLog).set({ entityType: 'tampered' })),
      INSUFFICIENT_PRIVILEGE,
    );
    await expectPgError(
      withTenant(db, tenantA, (tx) => tx.delete(auditLog)),
      INSUFFICIENT_PRIVILEGE,
    );
  });

  it('TC-1.2-08 does not leak the tenant setting outside the transaction', async () => {
    await withTenant(db, tenantA, async () => undefined);
    expect(await db.select().from(branches)).toEqual([]);
  });

  it('TC-1.2-09 rejects a non-UUID tenant id', async () => {
    await expect(withTenant(db, "x' or '1'='1", async () => undefined)).rejects.toThrow(/UUID/);
  });

  it('TC-1.2-11 every table is RLS-protected unless it is a listed platform table', async () => {
    // Guards against a new table being added without RLS. Platform tables hold no tenant data
    // of their own (auth: a user can belong to several tenants) and are reached only via the
    // auth layer; see ADR 003. Adding a table here needs a review.
    const PLATFORM_TABLES = [
      'account',
      'invitation',
      'member',
      'organization',
      'session',
      'user',
      'verification',
    ];
    const rows = await db.execute<{ table: string; rls: boolean; policies: number }>(sql`
      select c.relname as table,
             c.relrowsecurity as rls,
             (select count(*)::int from pg_policies p
               where p.schemaname = 'public' and p.tablename = c.relname) as policies
        from pg_class c
        join pg_namespace n on n.oid = c.relnamespace
       where n.nspname = 'public' and c.relkind in ('r', 'p')
    `);
    const tables = [...rows];
    expect(tables.map((t) => t.table)).toEqual(
      expect.arrayContaining(['tenants', 'branches', 'audit_log', 'user_branches']),
    );
    const unprotected = tables
      .filter((t) => !PLATFORM_TABLES.includes(t.table))
      .filter((t) => !t.rls || t.policies < 1)
      .map((t) => t.table);
    expect(unprotected).toEqual([]);
  });

  it('TC-1.2-12 concurrent transactions for different tenants each see only their own data', async () => {
    const runs = Array.from({ length: 20 }, (_, i) => (i % 2 === 0 ? tenantA : tenantB));
    const results = await Promise.all(
      runs.map((tenantId) =>
        withTenant(db, tenantId, async (tx) => {
          const rows = await tx.select({ tenantId: branches.tenantId }).from(branches);
          return { tenantId, seen: rows.map((r) => r.tenantId) };
        }),
      ),
    );
    for (const { tenantId, seen } of results) {
      expect(seen.length).toBeGreaterThan(0);
      expect(seen.every((t) => t === tenantId)).toBe(true);
    }
  });

  it('TC-1.5-01 records actor, action, entity, before and after', async () => {
    const entityId = randomUUID();
    const before = { name: 'Main' };
    const after = { name: 'Main Showroom' };
    const [row] = await withTenant(db, tenantA, async (tx) => {
      await writeAudit(tx, {
        tenantId: tenantA,
        branchId: branchA,
        actorUserId: 'user-123',
        action: 'update',
        entityType: 'branch',
        entityId,
        before,
        after,
      });
      return tx.select().from(auditLog).where(eq(auditLog.entityId, entityId));
    });
    expect(row).toMatchObject({
      tenantId: tenantA,
      branchId: branchA,
      actorUserId: 'user-123',
      action: 'update',
      entityType: 'branch',
      entityId,
      before,
      after,
    });
    expect(row?.createdAt).toBeInstanceOf(Date);
  });

  it('TC-1.5-04 rolls back the audit entry when the change rolls back', async () => {
    const entityId = randomUUID();
    await expect(
      withTenant(db, tenantA, async (tx) => {
        await writeAudit(tx, {
          tenantId: tenantA,
          actorUserId: null,
          action: 'create',
          entityType: 'branch',
          entityId,
        });
        throw new Error('change failed');
      }),
    ).rejects.toThrow('change failed');
    const rows = await withTenant(db, tenantA, (tx) =>
      tx.select().from(auditLog).where(eq(auditLog.entityId, entityId)),
    );
    expect(rows).toEqual([]);
  });
});
