import { inArray, schema, withTenant } from '@ebike/db';
import { getTranslations } from 'next-intl/server';
import { redirect } from 'next/navigation';
import { LanguageSwitcher } from '@/components/language-switcher';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getRequestContext } from '@/server/auth';
import { db } from '@/server/db';

export default async function DashboardPage() {
  const context = await getRequestContext();
  if (!context) redirect('/login');
  const t = await getTranslations();
  const scope = context.branchScope;

  const branchNames =
    scope.kind === 'all' || scope.branchIds.length === 0
      ? []
      : await withTenant(db, context.tenantId, (tx) =>
          tx
            .select({ name: schema.branches.name })
            .from(schema.branches)
            .where(inArray(schema.branches.id, scope.branchIds)),
        );

  return (
    <>
      <h1 className="text-xl font-semibold">
        {t('dashboard.welcome', { name: context.userName })}
      </h1>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t('dashboard.role')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div>
            <Badge>{t(`roles.${context.role}`)}</Badge>
          </div>
          <div className="text-sm">
            <span className="text-muted-foreground">{t('dashboard.branches')}: </span>
            {scope.kind === 'all'
              ? t('dashboard.allBranches')
              : branchNames.map((b) => b.name).join(', ')}
          </div>
        </CardContent>
      </Card>
      <p className="text-sm text-muted-foreground">{t('dashboard.comingSoon')}</p>
      <LanguageSwitcher />
    </>
  );
}
