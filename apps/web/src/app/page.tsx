import { useTranslations } from 'next-intl';

export default function HomePage() {
  const t = useTranslations();
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-3 px-4">
      <h1 className="text-2xl font-semibold">{t('app.name')}</h1>
      <p className="text-base opacity-80">{t('app.tagline')}</p>
      <p className="text-sm opacity-60">{t('home.comingSoon')}</p>
    </main>
  );
}
