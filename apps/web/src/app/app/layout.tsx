import { can } from '@ebike/core';
import { getTranslations } from 'next-intl/server';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import type { ReactNode } from 'react';
import { getRequestContext } from '@/server/auth';
import { SignOutButton } from './sign-out-button';

export const dynamic = 'force-dynamic';

/** Signed-in area. Every page below also checks its own permission on the server. */
export default async function AppLayout({ children }: { children: ReactNode }) {
  const context = await getRequestContext();
  if (!context) redirect('/login');
  const t = await getTranslations();

  const links = [
    { href: '/app', label: t('nav.dashboard') },
    ...(can(context.role, 'staff:manage') ? [{ href: '/app/staff', label: t('nav.staff') }] : []),
  ];

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur">
        <div className="mx-auto flex h-14 w-full max-w-3xl items-center justify-between gap-2 px-4">
          <Link href="/app" className="font-semibold text-primary">
            {t('app.name')}
          </Link>
          <SignOutButton />
        </div>
        <nav className="mx-auto flex w-full max-w-3xl gap-1 overflow-x-auto px-4 pb-2">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-md px-3 py-2 text-sm font-medium hover:bg-muted"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </header>
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-4 px-4 py-4">
        {children}
      </main>
    </div>
  );
}
