import 'server-only';
import { nextCookies } from 'better-auth/next-js';
import { headers } from 'next/headers';
import { cache } from 'react';
import { db } from '../db';
import { env } from '../env';
import { enqueue } from '../queue';
import { authorize, resolveContext, type RequestContext } from './context';
import { createAuth } from './create-auth';

export const auth = createAuth({
  db,
  secret: env.BETTER_AUTH_SECRET,
  baseURL: env.BETTER_AUTH_URL,
  sessionIdleHours: env.SESSION_IDLE_HOURS,
  // OTPs go out through the worker. The job expires with the OTP and is deleted soon after,
  // so the code does not linger in the queue tables.
  sendOtp: (phoneNumber, code) =>
    enqueue(
      'auth.sendOtp',
      { phoneNumber, code },
      {
        expireInSeconds: 5 * 60,
        retryLimit: 2,
        deleteAfterSeconds: 15 * 60,
      },
    ),
  plugins: [nextCookies()],
});

/** Context for server components and server actions; null when signed out or without a tenant. */
export const getRequestContext = cache(async (): Promise<RequestContext | null> => {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return null;
  return resolveContext(db, {
    userId: session.user.id,
    userName: session.user.name,
    activeOrganizationId: session.session.activeOrganizationId,
  });
});

/** For route handlers: checks the session and, optionally, one permission. */
export const authorizeRequest = (request: Request, permission?: Parameters<typeof authorize>[3]) =>
  authorize(auth, db, request.headers, permission);
