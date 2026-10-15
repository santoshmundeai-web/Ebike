import 'server-only';
import { jobs, type JobName, type JobPayload } from '@ebike/shared';
import { PgBoss, type SendOptions } from 'pg-boss';
import { env } from './env';

/**
 * Send-only pg-boss client: the web app enqueues, the worker processes and maintains the queue.
 * Messages are never sent inline in a request (CLAUDE.md section 5).
 */
const globalForQueue = globalThis as unknown as { ebikeQueue?: Promise<PgBoss> };

function boss(): Promise<PgBoss> {
  if (!env.QUEUE_DATABASE_URL)
    throw new Error('QUEUE_DATABASE_URL or DATABASE_URL_OWNER must be set');
  globalForQueue.ebikeQueue ??= (async () => {
    const instance = new PgBoss({
      connectionString: env.QUEUE_DATABASE_URL,
      schema: 'pgboss',
      // Maintenance and cron run in the worker. Installing/upgrading the schema is allowed here
      // too (pg-boss serialises it with an advisory lock) so the web app works if it starts first.
      supervise: false,
      schedule: false,
      max: 2,
    });
    await instance.start();
    return instance;
  })();
  return globalForQueue.ebikeQueue;
}

export async function enqueue<N extends JobName>(
  name: N,
  data: JobPayload<N>,
  options?: SendOptions,
): Promise<void> {
  const instance = await boss();
  // Idempotent; lets jobs wait in the queue even if the worker has not started yet.
  createdQueues[name] ??= instance.createQueue(name);
  await createdQueues[name];
  await instance.send(name, jobs[name].parse(data), options ?? {});
}

const createdQueues: Partial<Record<JobName, Promise<unknown>>> = {};
