import { getCurrentAdmin } from '@/lib/admin-auth';

export async function GET() {
  const admin = await getCurrentAdmin();
  if (!admin) {
    return Response.json({ authenticated: false }, { status: 401 });
  }
  return Response.json({ authenticated: true, user: admin });
}
