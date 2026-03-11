import { logoutUser } from '@/lib/user-auth';

export async function POST() {
  await logoutUser();
  return Response.json({ success: true });
}
