'use client';

import { indianMobileSchema } from '@ebike/shared';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { authClient } from '@/lib/auth-client';
import { cn } from '@/lib/utils';

type Mode = 'otp' | 'password';
type ErrorKey =
  | 'invalidCredentials'
  | 'accountDisabled'
  | 'invalidPhone'
  | 'invalidCode'
  | 'tooManyAttempts'
  | 'generic';

/** Map Better Auth errors to our messages without revealing whether an account exists. */
function errorKey(error: { status?: number; code?: string; message?: string }): ErrorKey {
  if (error.status === 429 || error.code === 'TOO_MANY_ATTEMPTS') return 'tooManyAttempts';
  if (error.message === 'ACCOUNT_DISABLED') return 'accountDisabled';
  if (error.code === 'INVALID_EMAIL_OR_PASSWORD' || error.status === 401)
    return 'invalidCredentials';
  if (error.code === 'INVALID_OTP' || error.code === 'OTP_EXPIRED') return 'invalidCode';
  return 'generic';
}

export function LoginForm() {
  const t = useTranslations('auth');
  const router = useRouter();
  const [mode, setMode] = useState<Mode>('otp');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<ErrorKey | null>(null);
  const [phone, setPhone] = useState<string | null>(null);

  async function run(action: () => Promise<{ error: unknown } | void>) {
    setBusy(true);
    setError(null);
    try {
      const result = await action();
      if (result?.error) setError(errorKey(result.error as Parameters<typeof errorKey>[0]));
    } catch {
      setError('generic');
    } finally {
      setBusy(false);
    }
  }

  async function sendOtp(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const raw = new FormData(event.currentTarget).get('phone');
    const parsed = indianMobileSchema.safeParse(raw ?? '');
    if (!parsed.success) return setError('invalidPhone');
    await run(async () => {
      const result = await authClient.phoneNumber.sendOtp({ phoneNumber: parsed.data });
      if (!result.error) setPhone(parsed.data);
      return result;
    });
  }

  async function verifyOtp(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const code = String(new FormData(event.currentTarget).get('code') ?? '').trim();
    await run(async () => {
      const result = await authClient.phoneNumber.verify({ phoneNumber: phone!, code });
      if (!result.error) router.replace('/app');
      return result;
    });
  }

  async function signInWithPassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    await run(async () => {
      const result = await authClient.signIn.email({
        email: String(data.get('email') ?? '').trim(),
        password: String(data.get('password') ?? ''),
      });
      if (!result.error) router.replace('/app');
      return result;
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <div role="tablist" className="grid grid-cols-2 gap-1 rounded-lg bg-muted p-1">
        {(['otp', 'password'] as const).map((m) => (
          <button
            key={m}
            type="button"
            role="tab"
            aria-selected={mode === m}
            onClick={() => {
              setMode(m);
              setError(null);
            }}
            className={cn(
              'h-10 rounded-md text-sm font-medium transition-colors',
              mode === m ? 'bg-background shadow-xs' : 'text-muted-foreground',
            )}
          >
            {m === 'otp' ? t('tabOtp') : t('tabPassword')}
          </button>
        ))}
      </div>

      {error && <Alert variant="destructive">{t(`errors.${error}`)}</Alert>}

      {mode === 'otp' && !phone && (
        <form onSubmit={sendOtp} className="flex flex-col gap-3" noValidate>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="phone">{t('phone')}</Label>
            <div className="flex items-center gap-2">
              <span className="text-base text-muted-foreground">+91</span>
              <Input
                id="phone"
                name="phone"
                type="tel"
                inputMode="numeric"
                autoComplete="tel-national"
                placeholder={t('phonePlaceholder')}
                required
              />
            </div>
          </div>
          <Button type="submit" size="touch" disabled={busy}>
            {busy ? t('working') : t('sendOtp')}
          </Button>
        </form>
      )}

      {mode === 'otp' && phone && (
        <form onSubmit={verifyOtp} className="flex flex-col gap-3">
          <Alert variant="success">{t('otpSent', { phone: `+91 ******${phone.slice(-4)}` })}</Alert>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="code">{t('code')}</Label>
            <Input
              id="code"
              name="code"
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="\d{6}"
              maxLength={6}
              required
              autoFocus
              className="tracking-[0.4em]"
            />
          </div>
          <Button type="submit" size="touch" disabled={busy}>
            {busy ? t('working') : t('verify')}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="touch"
            onClick={() => {
              setPhone(null);
              setError(null);
            }}
          >
            {t('changeNumber')}
          </Button>
        </form>
      )}

      {mode === 'password' && (
        <form onSubmit={signInWithPassword} className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="email">{t('email')}</Label>
            <Input id="email" name="email" type="email" autoComplete="username" required />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="password">{t('password')}</Label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
            />
          </div>
          <Button type="submit" size="touch" disabled={busy}>
            {busy ? t('working') : t('signIn')}
          </Button>
        </form>
      )}
    </div>
  );
}
