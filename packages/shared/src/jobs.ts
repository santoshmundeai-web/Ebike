import { z } from 'zod';

/**
 * Background job names and payload schemas, shared by the web app (which enqueues)
 * and the worker (which handles). Every payload is validated on both sides.
 */
export const jobs = {
  'system.heartbeat': z.object({}),
  /** Login OTP by SMS. Contains a secret: queued with a short expiry and deleted soon after. */
  'auth.sendOtp': z.object({
    phoneNumber: z.string().regex(/^\+91[6-9]\d{9}$/),
    code: z.string().regex(/^\d{4,8}$/),
  }),
} as const;

export type JobName = keyof typeof jobs;
export type JobPayload<N extends JobName> = z.infer<(typeof jobs)[N]>;
