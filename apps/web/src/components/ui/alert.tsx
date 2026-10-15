import * as React from 'react';
import { cn } from '@/lib/utils';

function Alert({
  className,
  variant = 'default',
  ...props
}: React.ComponentProps<'div'> & { variant?: 'default' | 'destructive' | 'success' }) {
  return (
    <div
      role={variant === 'destructive' ? 'alert' : 'status'}
      data-slot="alert"
      className={cn(
        'rounded-lg border px-3 py-2 text-sm',
        variant === 'destructive' && 'border-destructive/40 bg-destructive/10 text-destructive',
        variant === 'success' && 'border-primary/40 bg-primary/10 text-foreground',
        className,
      )}
      {...props}
    />
  );
}

export { Alert };
