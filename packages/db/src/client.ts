import { sql } from 'drizzle-orm';
import { drizzle, type PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

export type Database = PostgresJsDatabase<typeof schema>;
export type Transaction = Parameters<Parameters<Database['transaction']>[0]>[0];

export function createDb(
  url: string,
  options: postgres.Options<Record<string, postgres.PostgresType>> = {},
): {
  db: Database;
  close: () => Promise<void>;
} {
  const client = postgres(url, { max: 10, ...options });
  return { db: drizzle(client, { schema, casing: 'snake_case' }), close: () => client.end() };
}

/** Cheap connectivity check for health endpoints. */
export async function ping(db: Database): Promise<void> {
  await db.execute(sql`select 1`);
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Run `fn` in a transaction scoped to one tenant. RLS policies read `app.tenant_id`,
 * which is set with `is_local = true` so it cannot leak to other requests on a pooled connection.
 *
 * `tenantId` must come from the authenticated session, never from client input.
 */
export async function withTenant<T>(
  db: Database,
  tenantId: string,
  fn: (tx: Transaction) => Promise<T>,
): Promise<T> {
  if (!UUID.test(tenantId)) throw new Error('withTenant: tenantId must be a UUID');
  return db.transaction(async (tx) => {
    await tx.execute(sql`select set_config('app.tenant_id', ${tenantId}, true)`);
    return fn(tx);
  });
}
