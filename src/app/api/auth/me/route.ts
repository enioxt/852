import { getCurrentUser } from '@/lib/user-auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return Response.json({ user: null }, { headers: { 'Cache-Control': 'no-store, max-age=0' } });
  return Response.json({ user }, { headers: { 'Cache-Control': 'no-store, max-age=0' } });
}
