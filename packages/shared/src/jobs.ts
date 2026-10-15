import { z } from 'zod';

/**
 * Background job names and payload schemas, shared by the web app (which enqueues)
 * and the worker (which handles). Every payload is validated on both sides.
 */
export const jobs = {
  'system.heartbeat': z.object({}),
} as const;

export type JobName = keyof typeof jobs;
export type JobPayload<N extends JobName> = z.infer<(typeof jobs)[N]>;
