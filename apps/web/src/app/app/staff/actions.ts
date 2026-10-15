'use server';

import { can } from '@ebike/core';
import { newStaffSchema } from '@ebike/shared';
import { revalidatePath } from 'next/cache';
import { auth, getRequestContext } from '@/server/auth';
import { createStaff, deactivateStaff, StaffError } from '@/server/auth/staff';
import { db } from '@/server/db';

export type StaffActionState =
  | { status: 'idle' }
  | { status: 'ok'; name: string }
  | { status: 'error'; error: string; fields?: Record<string, string> };

/** Owner adds a staff user (STF-01). The permission is checked here, not only in the UI. */
export async function addStaffAction(
  _previous: StaffActionState,
  formData: FormData,
): Promise<StaffActionState> {
  const context = await getRequestContext();
  if (!context || !can(context.role, 'staff:manage'))
    return { status: 'error', error: 'forbidden' };

  const parsed = newStaffSchema.safeParse({
    name: formData.get('name'),
    email: formData.get('email') ?? '',
    phoneNumber: formData.get('phoneNumber'),
    role: formData.get('role'),
    branchIds: formData.getAll('branchIds'),
    password: formData.get('password') ?? '',
  });
  if (!parsed.success) {
    const fields = Object.fromEntries(
      parsed.error.issues.map((issue) => [String(issue.path[0]), issue.message]),
    );
    return { status: 'error', error: 'generic', fields };
  }

  try {
    await createStaff(auth, db, {
      tenantId: context.tenantId,
      actorUserId: context.userId,
      staff: parsed.data,
    });
  } catch (error) {
    if (error instanceof StaffError) return { status: 'error', error: error.code };
    throw error;
  }
  revalidatePath('/app/staff');
  return { status: 'ok', name: parsed.data.name };
}

export async function deactivateStaffAction(
  _previous: StaffActionState,
  formData: FormData,
): Promise<StaffActionState> {
  const context = await getRequestContext();
  if (!context || !can(context.role, 'staff:manage'))
    return { status: 'error', error: 'forbidden' };
  try {
    await deactivateStaff(auth, db, {
      tenantId: context.tenantId,
      actorUserId: context.userId,
      userId: String(formData.get('userId') ?? ''),
    });
  } catch (error) {
    if (error instanceof StaffError) return { status: 'error', error: error.code };
    throw error;
  }
  revalidatePath('/app/staff');
  return { status: 'ok', name: '' };
}
