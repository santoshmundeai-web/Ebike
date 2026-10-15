import { createLogger, jobs, type JobName, type JobPayload } from '@ebike/shared';
import { PgBoss } from 'pg-boss';
import { env } from './env';
import { createSmsProvider } from './messaging/sms';

const log = createLogger({ service: 'worker' });
const sms = createSmsProvider(env, log);

type Handler<N extends JobName> = (data: JobPayload<N>) => Promise<void>;

const handlers: { [N in JobName]: Handler<N> } = {
  'system.heartbeat': async () => {
    log.info('heartbeat');
  },
  'auth.sendOtp': async ({ phoneNumber, code }) => {
    await sms.sendOtp(phoneNumber, code);
  },
};

/** Cron schedules (in Asia/Kolkata) for recurring jobs. */
const schedules: Partial<Record<JobName, string>> = {
  'system.heartbeat': '*/5 * * * *',
};

const boss = new PgBoss({ connectionString: env.QUEUE_DATABASE_URL, schema: 'pgboss' });
boss.on('error', (error) => log.error('pg-boss error', { error }));

await boss.start();

async function register<N extends JobName>(name: N) {
  const handler: Handler<N> = handlers[name];
  await boss.createQueue(name);
  await boss.work(name, async (batch) => {
    for (const job of batch) {
      await handler(jobs[name].parse(job.data) as JobPayload<N>);
    }
  });
  const cron = schedules[name];
  if (cron) await boss.schedule(name, cron, {}, { tz: 'Asia/Kolkata' });
}

for (const name of Object.keys(handlers) as JobName[]) await register(name);

log.info('worker started', { queues: Object.keys(handlers), sms: sms.name });

async function shutdown(signal: string) {
  log.info('worker stopping', { signal });
  await boss.stop({ graceful: true, timeout: 20_000 });
  process.exit(0);
}
process.on('SIGINT', () => void shutdown('SIGINT'));
process.on('SIGTERM', () => void shutdown('SIGTERM'));
