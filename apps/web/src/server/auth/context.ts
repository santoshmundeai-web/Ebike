import {
  branchScope,
  can,
  isRole,
  permissionsOf,
  type BranchScope,
  type Permission,
  type Role,
} from '@ebike/core';
import { eq, schema, withTenant, type Database } from '@ebike/db';
import type { Auth } from './create-auth';
import { memberRole } from './create-auth';

/** Who is calling and what they may do. The tenant always comes from the session (CLAUDE.md). */
export interface RequestContext {
  userId: string;
  userName: string;
  tenantId: string;
  role: Role;
  permissions: Permission[];
  branchScope: BranchScope;
}

export async function resolveContext(
  db: Database,
  session: { userId: string; userName: string; activeOrganizationId?: string | null },
): Promise<RequestContext | null> {
  const tenantId = session.activeOrganizationId;
  if (!tenantId) return null;
  const role = await memberRole(db, session.userId, tenantId);
  if (!isRole(role)) return null;
  const assigned = await withTenant(db, tenantId, (tx) =>
    tx
      .select({ branchId: schema.userBranches.branchId })
      .from(schema.userBranches)
      .where(eq(schema.userBranches.userId, session.userId)),
  );
  return {
    userId: session.userId,
    userName: session.userName,
    tenantId,
    role,
    permissions: permissionsOf(role),
    branchScope: branchScope(
      role,
      assigned.map((a) => a.branchId),
    ),
  };
}

export type AuthorizeResult =
  | { ok: true; context: RequestContext }
  | { ok: false; status: 401 | 403; error: 'UNAUTHENTICATED' | 'FORBIDDEN' };

/**
 * Server-side permission check used by every API route and server action (TC-1.3-11).
 * Hiding a button in the UI is never enough.
 */
export async function authorize(
  auth: Auth,
  db: Database,
  headers: Headers,
  permission?: Permission,
): Promise<AuthorizeResult> {
  const session = await auth.api.getSession({ headers });
  if (!session) return { ok: false, status: 401, error: 'UNAUTHENTICATED' };
  const context = await resolveContext(db, {
    userId: session.user.id,
    userName: session.user.name,
    activeOrganizationId: session.session.activeOrganizationId,
  });
  if (!context) return { ok: false, status: 403, error: 'FORBIDDEN' };
  if (permission && !can(context.role, permission)) {
    return { ok: false, status: 403, error: 'FORBIDDEN' };
  }
  return { ok: true, context };
}
