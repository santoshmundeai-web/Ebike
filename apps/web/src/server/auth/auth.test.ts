import { randomUUID } from 'node:crypto';
import { createDb, eq, schema, withTenant, type Database } from '@ebike/db';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { authorize } from './context';
import { createAuth, type Auth } from './create-auth';
import { createStaff, deactivateStaff, listStaff, provisionTenant, StaffError } from './staff';

/**
 * Task 1.3 (STF-01, NFR-05): login with password and OTP, roles, deactivation.
 * Runs Better Auth against the real database as the RLS-restricted app role.
 */
const url = process.env.DATABASE_URL;

/** A random valid Indian mobile so test runs never collide. */
const randomMobile = () => `+919${String(Math.floor(Math.random() * 1e9)).padStart(9, '0')}`;

describe.skipIf(!url)('login, roles and staff (task 1.3)', () => {
  let db: Database;
  let close: () => Promise<void>;
  let auth: Auth;
  const sentOtps: { phoneNumber: string; code: string }[] = [];

  let tenantId: string;
  let branchId: string;
  let ownerId: string;
  const ownerEmail = `owner-${randomUUID()}@test.ebike.local`;
  const ownerPhone = randomMobile();
  const ownerPassword = 'Owner@12345';

  beforeAll(async () => {
    ({ db, close } = createDb(url!, { max: 4 }));
    auth = createAuth({
      db,
      secret: 'test-secret-test-secret-test-secret-0123',
      baseURL: 'http://localhost:3000',
      sessionIdleHours: 12,
      sendOtp: async (phoneNumber, code) => {
        sentOtps.push({ phoneNumber, code });
      },
    });
    const slug = `t-${randomUUID().slice(0, 8)}`;
    ({
      tenantId,
      branchId,
      ownerUserId: ownerId,
    } = await provisionTenant(auth, db, {
      name: 'Test Showroom',
      slug,
      stateCode: '27',
      branch: { code: 'MAIN', name: 'Main' },
      owner: { name: 'Owner', email: ownerEmail, phoneNumber: ownerPhone, password: ownerPassword },
    }));
  });

  beforeEach(() => {
    sentOtps.length = 0;
  });

  afterAll(async () => {
    await close?.();
  });

  async function signIn(email: string, password: string) {
    return auth.api.signInEmail({ body: { email, password }, asResponse: true });
  }

  /** Turn a sign-in response into request headers carrying its session cookie. */
  function sessionHeaders(response: Response): Headers {
    const cookie = response.headers
      .getSetCookie()
      .map((c) => c.split(';')[0])
      .join('; ');
    return new Headers({ cookie });
  }

  async function addStaff(
    role: Parameters<typeof createStaff>[2]['staff']['role'],
    password?: string,
  ) {
    const phoneNumber = randomMobile();
    const email = `${role}-${randomUUID()}@test.ebike.local`;
    const userId = await createStaff(auth, db, {
      tenantId,
      actorUserId: ownerId,
      staff: { name: `Staff ${role}`, email, phoneNumber, role, branchIds: [branchId], password },
    });
    return { userId, phoneNumber, email };
  }

  it('TC-1.3-01 signs in with email and password and lands in the tenant', async () => {
    const response = await signIn(ownerEmail, ownerPassword);
    expect(response.status).toBe(200);
    const session = await auth.api.getSession({ headers: sessionHeaders(response) });
    expect(session?.user.id).toBe(ownerId);
    expect(session?.session.activeOrganizationId).toBe(tenantId);
  });

  it('TC-1.3-02 wrong password and unknown user get the same generic error', async () => {
    const wrong = await signIn(ownerEmail, 'not-the-password');
    const unknown = await signIn(`nobody-${randomUUID()}@test.ebike.local`, 'whatever123');
    expect(wrong.status).toBe(401);
    expect(unknown.status).toBe(wrong.status);
    expect(await unknown.json()).toEqual(await wrong.json());
  });

  it('TC-1.3-03 stores only a password hash', async () => {
    const [account] = await db
      .select({ password: schema.account.password })
      .from(schema.account)
      .where(eq(schema.account.userId, ownerId));
    expect(account?.password).toBeTruthy();
    expect(account?.password).not.toContain(ownerPassword);
  });

  it('TC-1.3-04 phone OTP: sent to staff, signs in once, cannot be reused', async () => {
    await auth.api.sendPhoneNumberOTP({ body: { phoneNumber: ownerPhone } });
    expect(sentOtps).toHaveLength(1);
    const { code } = sentOtps[0]!;
    expect(code).toMatch(/^\d{6}$/);

    const ok = await auth.api.verifyPhoneNumber({
      body: { phoneNumber: ownerPhone, code },
      asResponse: true,
    });
    expect(ok.status).toBe(200);
    const session = await auth.api.getSession({ headers: sessionHeaders(ok) });
    expect(session?.user.id).toBe(ownerId);

    const reused = await auth.api.verifyPhoneNumber({
      body: { phoneNumber: ownerPhone, code },
      asResponse: true,
    });
    expect(reused.status).toBeGreaterThanOrEqual(400);
  });

  it('TC-1.3-04 unknown numbers get the same reply but no SMS', async () => {
    const reply = await auth.api.sendPhoneNumberOTP({
      body: { phoneNumber: randomMobile() },
      asResponse: true,
    });
    expect(reply.status).toBe(200);
    expect(sentOtps).toHaveLength(0);
  });

  it('TC-1.3-05 the OTP stops working after 3 wrong attempts', async () => {
    const staff = await addStaff('technician');
    await auth.api.sendPhoneNumberOTP({ body: { phoneNumber: staff.phoneNumber } });
    const { code } = sentOtps[0]!;
    const wrong = code === '000000' ? '111111' : '000000';
    for (let i = 0; i < 3; i++) {
      const r = await auth.api.verifyPhoneNumber({
        body: { phoneNumber: staff.phoneNumber, code: wrong },
        asResponse: true,
      });
      expect(r.status).toBeGreaterThanOrEqual(400);
    }
    const late = await auth.api.verifyPhoneNumber({
      body: { phoneNumber: staff.phoneNumber, code },
      asResponse: true,
    });
    expect(late.status).toBeGreaterThanOrEqual(400);
  });

  it('TC-1.3-05 OTP requests are rate limited per client', async () => {
    const statuses: number[] = [];
    for (let i = 0; i < 5; i++) {
      const response = await auth.handler(
        new Request('http://localhost:3000/api/auth/phone-number/send-otp', {
          method: 'POST',
          headers: { 'content-type': 'application/json', 'x-forwarded-for': '203.0.113.7' },
          body: JSON.stringify({ phoneNumber: ownerPhone }),
        }),
      );
      statuses.push(response.status);
    }
    expect(statuses).toContain(429);
  });

  it('TC-1.3-06 sign-out ends the session on the server', async () => {
    const headers = sessionHeaders(await signIn(ownerEmail, ownerPassword));
    expect(await auth.api.getSession({ headers })).not.toBeNull();
    await auth.api.signOut({ headers });
    expect(await auth.api.getSession({ headers })).toBeNull();
  });

  it('TC-1.3-07 a user with no membership in any tenant cannot sign in', async () => {
    const ctx = await auth.$context;
    const userId = randomUUID();
    const email = `orphan-${userId}@test.ebike.local`;
    await ctx.internalAdapter.createUser(
      { id: userId, name: 'Orphan', email },
      { method: 'admin' },
    );
    await ctx.internalAdapter.linkAccount({
      userId,
      providerId: 'credential',
      accountId: userId,
      password: await ctx.password.hash('Orphan@12345'),
    });
    expect((await signIn(email, 'Orphan@12345')).status).toBe(403);
  });

  it('TC-1.3-08 the owner adds staff with a role and branches', async () => {
    const staff = await addStaff('sales_executive', 'Sales@12345');
    const list = await listStaff(db, tenantId);
    expect(list.find((s) => s.userId === staff.userId)).toMatchObject({
      role: 'sales_executive',
      phoneNumber: staff.phoneNumber,
      branchIds: [branchId],
    });
    const audit = await withTenant(db, tenantId, (tx) =>
      tx.select().from(schema.auditLog).where(eq(schema.auditLog.entityId, staff.userId)),
    );
    expect(audit).toHaveLength(1);
    expect(JSON.stringify(audit[0]!.after)).not.toContain(staff.phoneNumber.slice(3));
  });

  it('TC-1.3-08 rejects a duplicate phone and branches of another tenant', async () => {
    await expect(
      createStaff(auth, db, {
        tenantId,
        actorUserId: ownerId,
        staff: { name: 'Dup', phoneNumber: ownerPhone, role: 'technician', branchIds: [branchId] },
      }),
    ).rejects.toEqual(new StaffError('PHONE_IN_USE'));
    await expect(
      createStaff(auth, db, {
        tenantId,
        actorUserId: ownerId,
        staff: {
          name: 'Other',
          phoneNumber: randomMobile(),
          role: 'technician',
          branchIds: [randomUUID()],
        },
      }),
    ).rejects.toEqual(new StaffError('UNKNOWN_BRANCH'));
  });

  it('TC-1.3-11 permissions are enforced on the server', async () => {
    const staff = await addStaff('sales_executive', 'Sales@12345');
    const headers = sessionHeaders(await signIn(staff.email, 'Sales@12345'));

    const allowed = await authorize(auth, db, headers, 'invoice:create');
    expect(allowed).toMatchObject({ ok: true, context: { tenantId, role: 'sales_executive' } });

    expect(await authorize(auth, db, headers, 'settings:update')).toEqual({
      ok: false,
      status: 403,
      error: 'FORBIDDEN',
    });
    expect(await authorize(auth, db, new Headers(), 'invoice:view')).toEqual({
      ok: false,
      status: 401,
      error: 'UNAUTHENTICATED',
    });
  });

  it('TC-1.2-13 a branch user gets their branch scope from the session', async () => {
    const staff = await addStaff('service_advisor', 'Service@12345');
    const headers = sessionHeaders(await signIn(staff.email, 'Service@12345'));
    const result = await authorize(auth, db, headers);
    expect(result).toMatchObject({
      ok: true,
      context: { branchScope: { kind: 'branches', branchIds: [branchId] } },
    });
  });

  it('TC-1.3-12 a deactivated user is signed out and cannot sign in again', async () => {
    const staff = await addStaff('accountant', 'Accounts@12345');
    const headers = sessionHeaders(await signIn(staff.email, 'Accounts@12345'));
    expect(await auth.api.getSession({ headers })).not.toBeNull();

    await deactivateStaff(auth, db, { tenantId, actorUserId: ownerId, userId: staff.userId });

    expect(await auth.api.getSession({ headers })).toBeNull();
    expect((await signIn(staff.email, 'Accounts@12345')).status).toBe(403);
    await auth.api.sendPhoneNumberOTP({ body: { phoneNumber: staff.phoneNumber } });
    expect(sentOtps).toHaveLength(0);
    expect((await listStaff(db, tenantId)).some((s) => s.userId === staff.userId)).toBe(false);
  });

  it('TC-1.3-12 the owner cannot deactivate themselves or the last owner', async () => {
    await expect(
      deactivateStaff(auth, db, { tenantId, actorUserId: ownerId, userId: ownerId }),
    ).rejects.toEqual(new StaffError('CANNOT_DEACTIVATE_SELF'));
    const other = await addStaff('branch_manager');
    await expect(
      deactivateStaff(auth, db, { tenantId, actorUserId: other.userId, userId: ownerId }),
    ).rejects.toEqual(new StaffError('LAST_OWNER'));
  });
});
