import { randomUUID } from 'node:crypto';
import type { Role } from '@ebike/core';
import { and, eq, inArray, schema, withTenant, writeAudit, type Database } from '@ebike/db';
import { maskPhone, newStaffSchema, type NewStaff } from '@ebike/shared';
import type { Auth } from './create-auth';

export class StaffError extends Error {
  constructor(
    readonly code:
      | 'PHONE_IN_USE'
      | 'EMAIL_IN_USE'
      | 'UNKNOWN_BRANCH'
      | 'NOT_A_MEMBER'
      | 'CANNOT_DEACTIVATE_SELF'
      | 'LAST_OWNER',
  ) {
    super(code);
  }
}

/** Placeholder for staff without email; `.invalid` can never receive mail. */
const placeholderEmail = (userId: string) => `${userId}@staff.ebike.invalid`;

/**
 * Owner adds a staff user with a role and branches (STF-01). The user is created in the auth
 * tables; branch assignments and the audit entry are written in the tenant's transaction.
 */
export async function createStaff(
  auth: Auth,
  db: Database,
  input: { tenantId: string; actorUserId: string | null; staff: NewStaff },
): Promise<string> {
  const staff = newStaffSchema.parse(input.staff);
  const { tenantId } = input;

  const known = await withTenant(db, tenantId, (tx) =>
    tx
      .select({ id: schema.branches.id })
      .from(schema.branches)
      .where(inArray(schema.branches.id, staff.branchIds)),
  );
  if (known.length !== new Set(staff.branchIds).size) throw new StaffError('UNKNOWN_BRANCH');

  const [phoneTaken] = await db
    .select({ id: schema.user.id })
    .from(schema.user)
    .where(eq(schema.user.phoneNumber, staff.phoneNumber));
  if (phoneTaken) throw new StaffError('PHONE_IN_USE');
  if (staff.email) {
    const [emailTaken] = await db
      .select({ id: schema.user.id })
      .from(schema.user)
      .where(eq(schema.user.email, staff.email));
    if (emailTaken) throw new StaffError('EMAIL_IN_USE');
  }

  const ctx = await auth.$context;
  const userId = randomUUID();
  await ctx.internalAdapter.createUser(
    {
      id: userId,
      name: staff.name,
      email: staff.email ?? placeholderEmail(userId),
      emailVerified: false,
      phoneNumber: staff.phoneNumber,
      phoneNumberVerified: false,
    },
    { method: 'admin' },
  );
  if (staff.password) {
    await ctx.internalAdapter.linkAccount({
      userId,
      providerId: 'credential',
      accountId: userId,
      password: await ctx.password.hash(staff.password),
    });
  }
  await auth.api.addMember({ body: { userId, organizationId: tenantId, role: staff.role } });

  await withTenant(db, tenantId, async (tx) => {
    await tx
      .insert(schema.userBranches)
      .values(staff.branchIds.map((branchId) => ({ tenantId, userId, branchId })));
    await writeAudit(tx, {
      tenantId,
      actorUserId: input.actorUserId,
      action: 'create',
      entityType: 'user',
      entityId: userId,
      after: {
        name: staff.name,
        role: staff.role,
        branchIds: staff.branchIds,
        phone: maskPhone(staff.phoneNumber),
      },
    });
  });
  return userId;
}

/**
 * Removes a staff user from the tenant and signs them out everywhere (TC-1.3-12).
 * A user with no remaining tenant cannot sign in at all.
 */
export async function deactivateStaff(
  auth: Auth,
  db: Database,
  input: { tenantId: string; actorUserId: string; userId: string },
): Promise<void> {
  const { tenantId, userId } = input;
  if (userId === input.actorUserId) throw new StaffError('CANNOT_DEACTIVATE_SELF');

  const members = await db
    .select({ userId: schema.member.userId, role: schema.member.role })
    .from(schema.member)
    .where(eq(schema.member.organizationId, tenantId));
  const target = members.find((m) => m.userId === userId);
  if (!target) throw new StaffError('NOT_A_MEMBER');
  if (target.role === 'owner' && members.filter((m) => m.role === 'owner').length === 1) {
    throw new StaffError('LAST_OWNER');
  }

  await db
    .delete(schema.member)
    .where(and(eq(schema.member.organizationId, tenantId), eq(schema.member.userId, userId)));
  await withTenant(db, tenantId, async (tx) => {
    const removed = await tx
      .delete(schema.userBranches)
      .where(eq(schema.userBranches.userId, userId))
      .returning({ branchId: schema.userBranches.branchId });
    await writeAudit(tx, {
      tenantId,
      actorUserId: input.actorUserId,
      action: 'delete',
      entityType: 'user',
      entityId: userId,
      before: { role: target.role, branchIds: removed.map((r) => r.branchId) },
    });
  });
  const ctx = await auth.$context;
  await ctx.internalAdapter.deleteUserSessions(userId);
}

export interface StaffMember {
  userId: string;
  name: string;
  email: string | null;
  phoneNumber: string | null;
  role: string;
  branchIds: string[];
}

export async function listStaff(db: Database, tenantId: string): Promise<StaffMember[]> {
  const members = await db
    .select({
      userId: schema.user.id,
      name: schema.user.name,
      email: schema.user.email,
      phoneNumber: schema.user.phoneNumber,
      role: schema.member.role,
    })
    .from(schema.member)
    .innerJoin(schema.user, eq(schema.user.id, schema.member.userId))
    .where(eq(schema.member.organizationId, tenantId))
    .orderBy(schema.user.name);
  const assignments = await withTenant(db, tenantId, (tx) =>
    tx
      .select({ userId: schema.userBranches.userId, branchId: schema.userBranches.branchId })
      .from(schema.userBranches),
  );
  return members.map((m) => ({
    ...m,
    email: m.email.endsWith('@staff.ebike.invalid') ? null : m.email,
    branchIds: assignments.filter((a) => a.userId === m.userId).map((a) => a.branchId),
  }));
}

export interface NewTenant {
  name: string;
  slug: string;
  stateCode: string;
  gstin?: string;
  branch: { code: string; name: string };
  owner: Omit<NewStaff, 'role' | 'branchIds'>;
}

/**
 * Creates a tenant, its first branch, the matching Better Auth organization and the owner.
 * Used by the seed now and by self-signup in Phase 2 (SAAS-03).
 */
export async function provisionTenant(
  auth: Auth,
  db: Database,
  input: NewTenant & { tenantId?: string },
): Promise<{ tenantId: string; branchId: string; ownerUserId: string }> {
  const tenantId = input.tenantId ?? randomUUID();
  const branchId = await withTenant(db, tenantId, async (tx) => {
    await tx.insert(schema.tenants).values({
      id: tenantId,
      name: input.name,
      slug: input.slug,
      gstin: input.gstin,
      stateCode: input.stateCode,
      status: 'active',
    });
    const [branch] = await tx
      .insert(schema.branches)
      .values({ tenantId, ...input.branch, stateCode: input.stateCode })
      .returning({ id: schema.branches.id });
    await writeAudit(tx, {
      tenantId,
      actorUserId: null,
      action: 'create',
      entityType: 'tenant',
      entityId: tenantId,
      after: { name: input.name, slug: input.slug, branch: input.branch.code },
    });
    return branch!.id;
  });
  await db.insert(schema.organization).values({ id: tenantId, name: input.name, slug: input.slug });
  const ownerUserId = await createStaff(auth, db, {
    tenantId,
    actorUserId: null,
    staff: { ...input.owner, role: 'owner' satisfies Role, branchIds: [branchId] },
  });
  return { tenantId, branchId, ownerUserId };
}
