import { can } from '@ebike/core';
import { isNull, schema, withTenant } from '@ebike/db';
import { getTranslations } from 'next-intl/server';
import { redirect } from 'next/navigation';
import { Alert } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getRequestContext } from '@/server/auth';
import { listStaff } from '@/server/auth/staff';
import { db } from '@/server/db';
import { AddStaffForm, DeactivateStaffButton } from './staff-forms';

/** Owner manages staff, roles and branches (STF-01, task 1.3). */
export default async function StaffPage() {
  const context = await getRequestContext();
  if (!context) redirect('/login');
  const t = await getTranslations();
  if (!can(context.role, 'staff:manage')) {
    return <Alert variant="destructive">{t('errors.forbidden')}</Alert>;
  }

  const [staff, branches] = await Promise.all([
    listStaff(db, context.tenantId),
    withTenant(db, context.tenantId, (tx) =>
      tx
        .select({ id: schema.branches.id, name: schema.branches.name })
        .from(schema.branches)
        .where(isNull(schema.branches.deletedAt))
        .orderBy(schema.branches.name),
    ),
  ]);
  const branchName = new Map(branches.map((b) => [b.id, b.name]));

  return (
    <>
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold">{t('staff.title')}</h1>
        <p className="text-sm text-muted-foreground">{t('staff.subtitle')}</p>
      </div>

      <ul className="flex flex-col gap-2" aria-label={t('staff.count', { count: staff.length })}>
        {staff.map((member) => (
          <li key={member.userId}>
            <Card className="flex-row items-start justify-between gap-3 p-3">
              <div className="flex min-w-0 flex-col gap-1">
                <p className="font-medium">
                  {member.name}
                  {member.userId === context.userId && (
                    <span className="text-muted-foreground"> ({t('staff.you')})</span>
                  )}
                </p>
                <p className="text-sm text-muted-foreground">
                  {member.phoneNumber}
                  {member.email ? ` · ${member.email}` : ''}
                </p>
                <div className="flex flex-wrap gap-1">
                  <Badge>{t(`roles.${member.role}` as 'roles.owner')}</Badge>
                  {member.branchIds.map((id) => (
                    <Badge key={id} className="bg-muted text-muted-foreground">
                      {branchName.get(id)}
                    </Badge>
                  ))}
                </div>
              </div>
              {member.userId !== context.userId && <DeactivateStaffButton userId={member.userId} />}
            </Card>
          </li>
        ))}
      </ul>

      <Card>
        <CardHeader>
          <CardTitle>{t('staff.addTitle')}</CardTitle>
        </CardHeader>
        <CardContent>
          <AddStaffForm branches={branches} />
        </CardContent>
      </Card>
    </>
  );
}
