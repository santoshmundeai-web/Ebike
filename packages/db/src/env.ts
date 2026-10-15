import { config } from 'dotenv';
import { fileURLToPath } from 'node:url';

/** Load the repository-root .env (scripts run with packages/db as the working directory). */
config({ path: fileURLToPath(new URL('../../../.env', import.meta.url)), quiet: true });
