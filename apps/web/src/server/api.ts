import 'server-only';
import type { Permission } from '@ebike/core';
import { NextResponse } from 'next/server';
import { authorizeRequest } from './auth';
import type { RequestContext } from './auth/context';

/** Typed JSON error used by every /api/v1 route. */
export function apiError(status: number, code: string, message?: string) {
  return NextResponse.json({ error: { code, message: message ?? code } }, { status });
}

/**
 * Wraps a /api/v1 handler: checks the session and permission on the server, then runs the
 * handler with the caller's context. The tenant comes from the session only (CLAUDE.md).
 */
export function withAuth(
  permission: Permission | undefined,
  handler: (request: Request, context: RequestContext) => Promise<Response>,
) {
  return async (request: Request) => {
    const result = await authorizeRequest(request, permission);
    if (!result.ok) return apiError(result.status, result.error);
    return handler(request, result.context);
  };
}
