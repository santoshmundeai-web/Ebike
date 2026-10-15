import { createLogger, jobs, type JobName, type JobPayload } from '@ebike/shared';
import { PgBoss } from 'pg-boss';
import { env } from './env';

const log = createLogger({ service: 'worker' });

type Handler<N extends JobName> = (data: JobPayload<N>) => Promise<void>;

const handlers: { [N in JobName]: Handler<N> } = {
  'system.heartbeat': async () => {
    log.info('heartbeat');
  },
};

/** Cron schedules (in Asia/Kolkata) for recurring jobs. */
const schedules: Partial<Record<JobName, string>> = {
  'system.heartbeat': '*/5 * * * *',
};

const boss = new PgBoss({ connectionString: env.QUEUE_DATABASE_URL, schema: 'pgboss' });
boss.on('error', (error) => log.error('pg-boss error', { error }));

await boss.start();

for (const name of Object.keys(handlers) as JobName[]) {
  await boss.createQueue(name);
  await boss.work(name, async (batch) => {
    for (const job of batch) {
      await handlers[name](jobs[name].parse(job.data));
    }
  });
  const cron = schedules[name];
  if (cron) await boss.schedule(name, cron, {}, { tz: 'Asia/Kolkata' });
}

log.info('worker started', { queues: Object.keys(handlers) });

async function shutdown(signal: string) {
  log.info('worker stopping', { signal });
  await boss.stop({ graceful: true, timeout: 20_000 });
  process.exit(0);
}
process.on('SIGINT', () => void shutdown('SIGINT'));
process.on('SIGTERM', () => void shutdown('SIGTERM'));
