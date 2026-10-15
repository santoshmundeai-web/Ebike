import { config } from 'dotenv';
import { fileURLToPath } from 'node:url';
import { defineProject } from 'vitest/config';

config({ path: fileURLToPath(new URL('../../.env', import.meta.url)), quiet: true });

export default defineProject({
  resolve: {
    alias: {
      '@/': fileURLToPath(new URL('./src/', import.meta.url)),
      // `server-only` throws outside the Next.js server build; it is a no-op in tests.
      'server-only': fileURLToPath(new URL('./test/server-only.ts', import.meta.url)),
    },
  },
  test: {
    name: 'web',
    include: ['src/**/*.test.ts'],
    environment: 'node',
    testTimeout: 30_000,
  },
});
