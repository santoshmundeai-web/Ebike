import { getTranslations } from 'next-intl/server';
import { redirect } from 'next/navigation';
import { LanguageSwitcher } from '@/components/language-switcher';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getRequestContext } from '@/server/auth';
import { LoginForm } from './login-form';

export const dynamic = 'force-dynamic';

export default async function LoginPage() {
  if (await getRequestContext()) redirect('/app');
  const t = await getTranslations();
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center gap-6 px-4 py-8">
      <div className="flex flex-col gap-1">
        <p className="text-2xl font-semibold text-primary">{t('app.name')}</p>
        <p className="text-sm text-muted-foreground">{t('app.tagline')}</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>{t('auth.title')}</CardTitle>
          <CardDescription>{t('auth.subtitle')}</CardDescription>
        </CardHeader>
        <CardContent>
          <LoginForm />
        </CardContent>
      </Card>
      <LanguageSwitcher className="justify-center" />
    </main>
  );
}
