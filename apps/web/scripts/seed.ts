/**
 * Demo data for local development, end-to-end tests and user-guide screenshots.
 * Never run against a live database: it creates users with known passwords.
 *
 *   pnpm db:seed
 */
import { config } from 'dotenv';
import { fileURLToPath } from 'node:url';
import type { Role } from '@ebike/core';
import { createDb, eq, schema, withTenant } from '@ebike/db';
import { createAuth } from '../src/server/auth/create-auth';
import { createStaff, provisionTenant } from '../src/server/auth/staff';

config({ path: fileURLToPath(new URL('../../../.env', import.meta.url)), quiet: true });

if (process.env.NODE_ENV === 'production')
  throw new Error('Refusing to seed demo data in production');
const url = process.env.DATABASE_URL;
if (!url) throw new Error('DATABASE_URL is not set');

/** Fixed id so links and tests can rely on the demo tenant. */
export const DEMO_TENANT_ID = '00000000-0000-4000-8000-000000000001';
export const DEMO_PASSWORD = 'Demo@12345';

const DEMO_STAFF: { role: Role; name: string; phone: string; email: string }[] = [
  {
    role: 'branch_manager',
    name: 'Ravi Kulkarni',
    phone: '+919999900002',
    email: 'manager@demo.ebike.local',
  },
  {
    role: 'sales_executive',
    name: 'Sneha Patil',
    phone: '+919999900003',
    email: 'sales@demo.ebike.local',
  },
  {
    role: 'service_advisor',
    name: 'Amit Joshi',
    phone: '+919999900004',
    email: 'service@demo.ebike.local',
  },
  {
    role: 'technician',
    name: 'Imran Shaikh',
    phone: '+919999900005',
    email: 'tech@demo.ebike.local',
  },
  {
    role: 'accountant',
    name: 'Pooja Deshmukh',
    phone: '+919999900006',
    email: 'accounts@demo.ebike.local',
  },
];

const { db, close } = createDb(url, { max: 2 });
const auth = createAuth({
  db,
  secret: process.env.BETTER_AUTH_SECRET ?? 'seed-only-secret-seed-only-secret-0000',
  baseURL: process.env.BETTER_AUTH_URL ?? 'http://localhost:3000',
  sessionIdleHours: 12,
  sendOtp: async () => undefined,
});

try {
  const [existing] = await db
    .select({ id: schema.organization.id })
    .from(schema.organization)
    .where(eq(schema.organization.id, DEMO_TENANT_ID));
  if (existing) {
    console.log('demo tenant already seeded');
  } else {
    const { tenantId, ownerUserId } = await provisionTenant(auth, db, {
      tenantId: DEMO_TENANT_ID,
      name: 'Demo E-Bikes',
      slug: 'demo',
      stateCode: '27',
      branch: { code: 'MAIN', name: 'Main Showroom, Pune' },
      owner: {
        name: 'Demo Owner',
        email: 'owner@demo.ebike.local',
        phoneNumber: '+919999900001',
        password: DEMO_PASSWORD,
      },
    });
    const [second] = await withTenant(db, tenantId, (tx) =>
      tx
        .insert(schema.branches)
        .values({ tenantId, code: 'KOTH', name: 'Kothrud Service Centre', stateCode: '27' })
        .returning({ id: schema.branches.id }),
    );
    const [main] = await withTenant(db, tenantId, (tx) =>
      tx
        .select({ id: schema.branches.id })
        .from(schema.branches)
        .where(eq(schema.branches.code, 'MAIN')),
    );
    for (const s of DEMO_STAFF) {
      await createStaff(auth, db, {
        tenantId,
        actorUserId: ownerUserId,
        staff: {
          name: s.name,
          email: s.email,
          phoneNumber: s.phone,
          role: s.role,
          branchIds: s.role === 'technician' ? [second!.id] : [main!.id],
          password: DEMO_PASSWORD,
        },
      });
    }
    console.log('seeded demo tenant: sign in as owner@demo.ebike.local /', DEMO_PASSWORD);
  }
} finally {
  await close();
}
