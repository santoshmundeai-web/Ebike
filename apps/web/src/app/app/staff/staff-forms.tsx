'use client';

import { ROLES } from '@ebike/core';
import { useTranslations } from 'next-intl';
import { useActionState, useEffect, useRef } from 'react';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input, NativeSelect } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { addStaffAction, deactivateStaffAction, type StaffActionState } from './actions';

const idle: StaffActionState = { status: 'idle' };

/** Error codes from the server map to messages under `staff.errors`. */
function useErrorText() {
  const t = useTranslations('staff.errors');
  return (code: string) => (t.has(code) ? t(code) : t('generic'));
}

export function AddStaffForm({ branches }: { branches: { id: string; name: string }[] }) {
  const t = useTranslations();
  const errorText = useErrorText();
  const [state, action, pending] = useActionState(addStaffAction, idle);
  const formRef = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state.status === 'ok') formRef.current?.reset();
  }, [state]);

  const fieldError = (field: string) =>
    state.status === 'error' && state.fields?.[field] ? errorText(state.fields[field]) : null;

  return (
    <form ref={formRef} action={action} className="flex flex-col gap-3">
      {state.status === 'ok' && (
        <Alert variant="success">{t('staff.added', { name: state.name })}</Alert>
      )}
      {state.status === 'error' && !state.fields && (
        <Alert variant="destructive">{errorText(state.error)}</Alert>
      )}

      <Field id="name" label={t('staff.name')} error={fieldError('name')}>
        <Input id="name" name="name" autoComplete="off" required />
      </Field>
      <Field id="phoneNumber" label={t('staff.phone')} error={fieldError('phoneNumber')}>
        <Input id="phoneNumber" name="phoneNumber" type="tel" inputMode="numeric" required />
      </Field>
      <Field id="role" label={t('staff.role')} error={fieldError('role')}>
        <NativeSelect id="role" name="role" defaultValue="sales_executive">
          {ROLES.map((role) => (
            <option key={role} value={role}>
              {t(`roles.${role}`)}
            </option>
          ))}
        </NativeSelect>
      </Field>
      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1 text-sm font-medium">{t('staff.branches')}</legend>
        {branches.map((branch, index) => (
          <Label key={branch.id} className="h-10 font-normal">
            <input
              type="checkbox"
              name="branchIds"
              value={branch.id}
              defaultChecked={index === 0}
              className="size-5 accent-primary"
            />
            {branch.name}
          </Label>
        ))}
        {fieldError('branchIds') && (
          <p className="text-sm text-destructive">{fieldError('branchIds')}</p>
        )}
      </fieldset>
      <Field id="email" label={t('staff.email')} error={fieldError('email')}>
        <Input id="email" name="email" type="email" autoComplete="off" />
      </Field>
      <Field id="password" label={t('staff.password')} error={fieldError('password')}>
        <Input id="password" name="password" type="password" autoComplete="new-password" />
        <p className="text-xs text-muted-foreground">{t('staff.passwordHint')}</p>
      </Field>
      <Button type="submit" size="touch" disabled={pending}>
        {t('staff.add')}
      </Button>
    </form>
  );
}

function Field({
  id,
  label,
  error,
  children,
}: {
  id: string;
  label: string;
  error: string | null;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      {children}
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}

export function DeactivateStaffButton({ userId }: { userId: string }) {
  const t = useTranslations('staff');
  const errorText = useErrorText();
  const [state, action, pending] = useActionState(deactivateStaffAction, idle);
  return (
    <form action={action} className="flex flex-col items-end gap-1">
      <input type="hidden" name="userId" value={userId} />
      <Button type="submit" variant="destructive" size="sm" disabled={pending}>
        {t('deactivate')}
      </Button>
      {state.status === 'error' && (
        <p className="text-xs text-destructive">{errorText(state.error)}</p>
      )}
    </form>
  );
}
