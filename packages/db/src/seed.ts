import './env';
import { createDb, withTenant } from './client';
import { writeAudit } from './audit';
import { branches, tenants } from './schema';

/** Fixed id so the demo tenant is stable across re-seeds. */
const DEMO_TENANT_ID = '00000000-0000-4000-8000-000000000001';

const url = process.env.DATABASE_URL;
if (!url) throw new Error('DATABASE_URL is not set');

const { db, close } = createDb(url, { max: 1 });
try {
  await withTenant(db, DEMO_TENANT_ID, async (tx) => {
    const existing = await tx.select({ id: tenants.id }).from(tenants);
    if (existing.length > 0) {
      console.log('demo tenant already seeded');
      return;
    }
    await tx.insert(tenants).values({
      id: DEMO_TENANT_ID,
      name: 'Demo E-Bikes',
      slug: 'demo',
      stateCode: '27',
      status: 'active',
    });
    const [branch] = await tx
      .insert(branches)
      .values({ tenantId: DEMO_TENANT_ID, code: 'MAIN', name: 'Main Showroom', stateCode: '27' })
      .returning();
    await writeAudit(tx, {
      tenantId: DEMO_TENANT_ID,
      actorUserId: null,
      action: 'create',
      entityType: 'branch',
      entityId: branch!.id,
      after: branch,
    });
    console.log('seeded demo tenant');
  });
} finally {
  await close();
}
