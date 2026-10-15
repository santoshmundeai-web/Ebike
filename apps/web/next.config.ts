import { config } from 'dotenv';
import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';
import { fileURLToPath } from 'node:url';

// One .env at the repository root serves web, worker and db scripts.
config({ path: fileURLToPath(new URL('../../.env', import.meta.url)), quiet: true });

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

const nextConfig: NextConfig = {
  // Self-contained server bundle for the Docker image.
  output: 'standalone',
  // Workspace packages ship TypeScript source.
  transpilePackages: ['@ebike/core', '@ebike/db', '@ebike/shared'],
  poweredByHeader: false,
};

export default withNextIntl(nextConfig);
