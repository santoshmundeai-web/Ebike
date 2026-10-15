import 'server-only';
import { z } from 'zod';

export const env = z
  .object({
    /** RLS-restricted app role. The web app never connects as the schema owner. */
    DATABASE_URL: z.string().url(),
  })
  .parse(process.env);
