import 'server-only';
import { createDb, type Database } from '@ebike/db';
import { env } from './env';

// Reuse one pool across hot reloads in development.
const globalForDb = globalThis as unknown as { ebikeDb?: Database };

export const db: Database = globalForDb.ebikeDb ?? createDb(env.DATABASE_URL).db;
if (process.env.NODE_ENV !== 'production') globalForDb.ebikeDb = db;
