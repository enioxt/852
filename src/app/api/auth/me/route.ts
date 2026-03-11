import { getCurrentUser } from '@/lib/user-auth';

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return Response.json({ user: null });
  return Response.json({ user });
}
