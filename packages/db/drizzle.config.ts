import './src/env';
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  dialect: 'postgresql',
  schema: './src/schema/index.ts',
  out: './drizzle',
  // Migrations run as the table owner, never as the RLS-restricted app role.
  dbCredentials: { url: process.env.DATABASE_URL_OWNER ?? '' },
  casing: 'snake_case',
  strict: true,
  verbose: true,
});
