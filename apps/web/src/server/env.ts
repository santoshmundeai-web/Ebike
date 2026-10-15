import 'server-only';
import { z } from 'zod';

export const env = z
  .object({
    NODE_ENV: z.string().optional(),
    /** RLS-restricted app role. Tenant data is never read as the schema owner. */
    DATABASE_URL: z.string().url(),
    /** pg-boss connection (its own `pgboss` schema); defaults to the owner connection. */
    QUEUE_DATABASE_URL: z.string().url().optional(),
    DATABASE_URL_OWNER: z.string().url().optional(),
    BETTER_AUTH_SECRET: z.string().min(32, 'BETTER_AUTH_SECRET must be at least 32 characters'),
    BETTER_AUTH_URL: z.string().url(),
    SESSION_IDLE_HOURS: z.coerce
      .number()
      .int()
      .min(1)
      .max(24 * 30)
      .default(12),
  })
  .transform((e) => ({ ...e, QUEUE_DATABASE_URL: e.QUEUE_DATABASE_URL ?? e.DATABASE_URL_OWNER }))
  .parse(process.env);
