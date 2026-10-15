import { config } from 'dotenv';
import { fileURLToPath } from 'node:url';
import { z } from 'zod';

config({ path: fileURLToPath(new URL('../../../.env', import.meta.url)), quiet: true });

export const env = z
  .object({
    /** RLS-restricted app role, for tenant data. */
    DATABASE_URL: z.string().url(),
    /** pg-boss keeps its tables in the `pgboss` schema and needs to create it, so it uses the owner. */
    QUEUE_DATABASE_URL: z.string().url().optional(),
    DATABASE_URL_OWNER: z.string().url(),
  })
  .transform((e) => ({ ...e, QUEUE_DATABASE_URL: e.QUEUE_DATABASE_URL ?? e.DATABASE_URL_OWNER }))
  .parse(process.env);
