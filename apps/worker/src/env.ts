import { config } from 'dotenv';
import { fileURLToPath } from 'node:url';
import { z } from 'zod';

config({ path: fileURLToPath(new URL('../../../.env', import.meta.url)), quiet: true });

/** An empty value in .env counts as not set. */
const optionalString = z
  .string()
  .optional()
  .transform((v) => v || undefined);

export const env = z
  .object({
    NODE_ENV: z.string().optional(),
    /** RLS-restricted app role, for tenant data. */
    DATABASE_URL: z.string().url(),
    /** pg-boss keeps its tables in the `pgboss` schema and needs to create it, so it uses the owner. */
    QUEUE_DATABASE_URL: z.string().url().optional(),
    DATABASE_URL_OWNER: z.string().url(),
    /** SMS/OTP. Without these, development prints OTPs to the console. */
    MSG91_AUTH_KEY: optionalString,
    MSG91_OTP_TEMPLATE_ID: optionalString,
  })
  .transform((e) => ({ ...e, QUEUE_DATABASE_URL: e.QUEUE_DATABASE_URL ?? e.DATABASE_URL_OWNER }))
  .parse(process.env);
