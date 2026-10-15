import { redirect } from 'next/navigation';
import { getRequestContext } from '@/server/auth';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  redirect((await getRequestContext()) ? '/app' : '/login');
}
