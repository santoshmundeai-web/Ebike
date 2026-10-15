import { NextResponse } from 'next/server';
import { withAuth } from '@/server/api';

export const dynamic = 'force-dynamic';

/** The signed-in user, their tenant, role, permissions and branch scope. */
export const GET = withAuth(undefined, async (_request, context) => NextResponse.json(context));
