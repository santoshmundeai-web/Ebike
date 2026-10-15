'use client';

import { useLocale, useTranslations } from 'next-intl';
import { useTransition } from 'react';
import { setLocale } from '@/i18n/actions';
import { locales } from '@/i18n/config';
import { cn } from '@/lib/utils';

export function LanguageSwitcher({ className }: { className?: string }) {
  const t = useTranslations('language');
  const current = useLocale();
  const [pending, startTransition] = useTransition();
  return (
    <div role="group" aria-label={t('label')} className={cn('flex gap-1 text-sm', className)}>
      {locales.map((locale) => (
        <button
          key={locale}
          type="button"
          disabled={pending || locale === current}
          aria-pressed={locale === current}
          onClick={() => startTransition(() => setLocale(locale))}
          className={cn(
            'h-9 rounded-md px-3',
            locale === current ? 'bg-muted font-medium' : 'text-muted-foreground underline',
          )}
        >
          {t(locale)}
        </button>
      ))}
    </div>
  );
}
