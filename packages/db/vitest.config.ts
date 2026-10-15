import { defineProject } from 'vitest/config';
import './src/env';

export default defineProject({
  test: { name: 'db', include: ['src/**/*.test.ts'], testTimeout: 20_000 },
});
